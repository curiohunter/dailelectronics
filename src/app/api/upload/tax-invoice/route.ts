import { NextRequest, NextResponse } from 'next/server'
import { FileParser } from '@/services/file-parser'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

type CustomerUpdate = Database['public']['Tables']['customers']['Update']

// Create supabase client for server-side use
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    console.log('세금계산서 업로드 시작')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.error('파일이 제공되지 않음')
      return NextResponse.json(
        { error: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      )
    }
    
    console.log('파일 정보:', {
      name: file.name,
      size: file.size,
      type: file.type
    })
    
    // 파일 파싱
    let invoices, customers
    try {
      const result = await FileParser.parseTaxInvoiceFile(file)
      invoices = result.invoices
      customers = result.customers
      console.log(`파싱 완료: ${invoices.length}개 세금계산서, ${customers.length}개 거래처`)
    } catch (parseError) {
      console.error('파일 파싱 오류:', parseError)
      return NextResponse.json(
        { 
          error: '파일 파싱 중 오류가 발생했습니다.',
          details: parseError instanceof Error ? parseError.message : '알 수 없는 오류'
        },
        { status: 400 }
      )
    }
    
    // 고객 정보 먼저 저장/업데이트
    const customerMap = new Map<string, string>() // business_number -> customer_id
    let newCustomerCount = 0
    let updatedCustomerCount = 0
    
    for (const customer of customers) {
      // 기존 고객 확인
      interface ExistingCustomer {
        id: string
        company_name: string
        address: string | null
        ceo_name: string | null
        business_type: string | null
        business_category: string | null
      }
      
      const { data: existingCustomer } = await (supabase as any)
        .from('customers')
        .select('id, company_name, address, ceo_name, business_type, business_category')
        .eq('business_number', customer.business_number!)
        .single() as { data: ExistingCustomer | null }
      
      if (existingCustomer) {
        // 기존 고객 정보와 비교하여 변경사항이 있으면 업데이트
        // Customer from parser only has company_name, address, representative_name
        const hasChanges = 
          existingCustomer.company_name !== customer.company_name ||
          existingCustomer.address !== customer.address
        
        // 대표자명이 변경되었는지 확인
        interface CurrentCustomerData {
          representative_name: string | null
          alias_names: string[] | null
        }
        
        const { data: currentData } = await (supabase as any)
          .from('customers')
          .select('representative_name, alias_names')
          .eq('id', existingCustomer.id)
          .single() as { data: CurrentCustomerData | null }
        
        let updateData: CustomerUpdate = {}
        let needsUpdate = false
        
        if (hasChanges) {
          updateData = {
            company_name: customer.company_name,
            address: customer.address,
            updated_at: new Date().toISOString()
          }
          needsUpdate = true
        }
        
        // 대표자명이 변경되었거나 새로 추가된 경우
        if (customer.representative_name && 
            (currentData?.representative_name !== customer.representative_name || 
             !currentData?.representative_name)) {
          updateData.representative_name = customer.representative_name
          
          // 별칭 배열에 새 대표자명 추가
          let updatedAliases = currentData?.alias_names || []
          if (!updatedAliases.includes(customer.representative_name)) {
            updatedAliases = [customer.representative_name, ...updatedAliases]
            updateData.alias_names = updatedAliases
          }
          needsUpdate = true
        }
        
        if (needsUpdate) {
          // 변경된 정보 업데이트
          const { error: updateError } = await (supabase as any)
            .from('customers')
            .update(updateData)
            .eq('id', existingCustomer.id)
          
          if (updateError) {
            console.error('고객 정보 업데이트 오류:', updateError)
          } else {
            updatedCustomerCount++
            console.log(`고객 정보 업데이트: ${customer.company_name} (${customer.business_number})`)
          }
        }
        
        customerMap.set(customer.business_number!, existingCustomer.id)
      } else {
        // 새 고객 생성 시 대표자명을 별칭에 자동 포함
        const customerToInsert = { ...customer }
        
        // 대표자명이 있고 별칭 배열에 없으면 추가
        if (customer.representative_name) {
          if (!customerToInsert.alias_names) {
            customerToInsert.alias_names = []
          }
          if (!customerToInsert.alias_names.includes(customer.representative_name)) {
            customerToInsert.alias_names = [customer.representative_name, ...customerToInsert.alias_names]
          }
        }
        
        const { data: newCustomer, error } = await (supabase as any)
          .from('customers')
          .insert(customerToInsert)
          .select('id, business_number')
          .single()
        
        if (error) {
          console.error('고객 생성 오류:', error)
          continue
        }
        
        if (newCustomer && newCustomer.business_number) {
          customerMap.set(newCustomer.business_number, newCustomer.id)
          newCustomerCount++
          console.log(`새 고객 생성: ${customer.company_name} (${customer.business_number})`)
        }
      }
    }
    
    // 세금계산서 저장
    let successCount = 0
    let skipCount = 0
    let errorCount = 0
    
    for (const invoice of invoices) {
      // customer_id 필드 제거 (관계 테이블로 관리)
      const { customer_id, ...invoiceData } = invoice as any
      
      // 중복 확인 (승인번호 기준)
      const { data: existing } = await (supabase as any)
        .from('tax_invoices')
        .select('id')
        .eq('approval_number', invoiceData.approval_number!)
        .single()
      
      if (existing) {
        skipCount++
        console.log(`중복 건너뜀: 승인번호 ${invoiceData.approval_number}`)
        continue
      }
      
      // 세금계산서 저장
      const { data: newInvoice, error } = await (supabase as any)
        .from('tax_invoices')
        .insert(invoiceData)
        .select('id')
        .single()
      
      if (error) {
        console.error('세금계산서 저장 오류:', error)
        errorCount++
        continue
      }
      
      // customer_tax_invoices 관계 생성
      if (newInvoice) {
        // buyer_company_name으로 고객 찾기
        // 먼저 정확한 company_name 매칭 시도
        let customer = null;

        if (invoiceData.buyer_company_name) {
          // 회사명 정규화 (공백 제거, 소문자 변환)
          const normalizedBuyerName = invoiceData.buyer_company_name.trim().toLowerCase();

          // 모든 고객 조회 후 JavaScript에서 매칭
          const { data: allCustomers } = await (supabase as any)
            .from('customers')
            .select('id, company_name, alias_names')

          if (allCustomers && allCustomers.length > 0) {
            // 정확한 company_name 매칭 또는 alias_names 매칭
            customer = allCustomers.find((c: any) => {
              // company_name 정규화 후 비교
              if (c.company_name) {
                const normalizedCompanyName = c.company_name.trim().toLowerCase();
                if (normalizedCompanyName === normalizedBuyerName) {
                  return true;
                }
              }

              // alias_names 배열 검사
              if (c.alias_names && Array.isArray(c.alias_names)) {
                return c.alias_names.some((alias: string) =>
                  alias.trim().toLowerCase() === normalizedBuyerName
                );
              }

              return false;
            });
          }

          // 사업자번호로도 매칭 시도 (invoiceData에 buyer_business_number가 있는 경우)
          if (!customer && invoiceData.buyer_business_number) {
            const { data: customerByBizNum } = await (supabase as any)
              .from('customers')
              .select('id')
              .eq('business_number', invoiceData.buyer_business_number)
              .single()

            customer = customerByBizNum;
          }
        }

        // 관계 테이블에 레코드 생성 (customer_id는 NULL 허용)
        const { error: relationError } = await (supabase as any)
          .from('customer_tax_invoices')
          .insert({
            customer_id: customer?.id || null,
            tax_invoice_id: newInvoice.id
          })

        if (relationError) {
          console.error('관계 생성 오류:', relationError)
        } else {
          console.log(`세금계산서 연결: ${invoiceData.buyer_company_name} -> ${customer ? '고객 찾음' : '고객 없음'}`)
        }

        successCount++
      }
    }
    
    // 상세한 메시지 생성
    let message = `세금계산서: ${successCount}건 저장, ${skipCount}건 중복`
    if (errorCount > 0) {
      message += `, ${errorCount}건 오류`
    }
    
    // 고객 정보 업데이트 내역 추가
    if (newCustomerCount > 0 || updatedCustomerCount > 0) {
      message += ` | 고객: `
      if (newCustomerCount > 0) {
        message += `${newCustomerCount}건 신규`
      }
      if (updatedCustomerCount > 0) {
        if (newCustomerCount > 0) message += ', '
        message += `${updatedCustomerCount}건 업데이트`
      }
    }
    
    return NextResponse.json({
      success: true,
      message: message,
      data: {
        invoices: {
          saved: successCount,
          skipped: skipCount,
          errors: errorCount,
          total: invoices.length
        },
        customers: {
          new: newCustomerCount,
          updated: updatedCustomerCount,
          total: customers.length
        }
      }
    })
    
  } catch (error) {
    console.error('파일 업로드 오류:', error)
    return NextResponse.json(
      { error: '파일 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}