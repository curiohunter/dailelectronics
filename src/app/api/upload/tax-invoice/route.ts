import { NextRequest, NextResponse } from 'next/server'
import { FileParser } from '@/services/file-parser'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'

type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export async function POST(request: NextRequest) {
  const supabase = await createClient()

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
      console.log(`🚀 파싱 완료: ${invoices.length}개 세금계산서, ${customers.length}개 거래처`)
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

    // ===== 1단계: 사전 데이터 로드 (1회만 실행) =====
    console.log('📥 사전 데이터 로드 중...')

    // 전체 고객 목록 조회 (1회)
    interface ExistingCustomer {
      id: string
      company_name: string
      address: string | null
      business_number: string | null
      representative_name: string | null
      alias_names: string[] | null
    }

    const { data: allExistingCustomers } = await supabase
      .from('customers')
      .select('id, company_name, address, business_number, representative_name, alias_names')
      .returns<ExistingCustomer[]>()

    // 사업자번호로 빠른 검색을 위한 Map
    const existingCustomersByBizNum = new Map<string, ExistingCustomer>()
    allExistingCustomers?.forEach(c => {
      if (c.business_number) {
        existingCustomersByBizNum.set(c.business_number, c)
      }
    })

    console.log(`✅ 기존 고객 로드: ${allExistingCustomers?.length || 0}명`)

    // ===== 2단계: 고객 정보 배치 처리 =====
    const customerMap = new Map<string, string>() // business_number -> customer_id
    const customersToInsert: any[] = []
    const customersToUpdate: { id: string, data: CustomerUpdate }[] = []
    let newCustomerCount = 0
    let updatedCustomerCount = 0

    for (const customer of customers) {
      const existingCustomer = customer.business_number
        ? existingCustomersByBizNum.get(customer.business_number)
        : null

      if (existingCustomer) {
        // 변경사항 확인
        const hasChanges =
          existingCustomer.company_name !== customer.company_name ||
          existingCustomer.address !== customer.address

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

        // 대표자명 변경 확인
        if (customer.representative_name &&
            existingCustomer.representative_name !== customer.representative_name) {
          updateData.representative_name = customer.representative_name

          // 별칭 배열에 새 대표자명 추가
          let updatedAliases = existingCustomer.alias_names || []
          if (!updatedAliases.includes(customer.representative_name)) {
            updatedAliases = [customer.representative_name, ...updatedAliases]
            updateData.alias_names = updatedAliases
          }
          needsUpdate = true
        }

        if (needsUpdate) {
          customersToUpdate.push({ id: existingCustomer.id, data: updateData })
          console.log(`업데이트 예정: ${customer.company_name} (${customer.business_number})`)
        }

        customerMap.set(customer.business_number!, existingCustomer.id)
      } else {
        // 새 고객 생성 준비
        const customerToInsert = { ...customer }

        // 대표자명을 별칭에 자동 포함
        if (customer.representative_name) {
          if (!customerToInsert.alias_names) {
            customerToInsert.alias_names = []
          }
          if (!customerToInsert.alias_names.includes(customer.representative_name)) {
            customerToInsert.alias_names = [customer.representative_name, ...customerToInsert.alias_names]
          }
        }

        customersToInsert.push(customerToInsert)
      }
    }

    // 고객 업데이트 배치 실행
    for (const { id, data } of customersToUpdate) {
      const { error } = await (supabase as any)
        .from('customers')
        .update(data)
        .eq('id', id)

      if (!error) {
        updatedCustomerCount++
      }
    }

    // 고객 삽입 배치 실행
    if (customersToInsert.length > 0) {
      const { data: newCustomers, error } = await (supabase as any)
        .from('customers')
        .insert(customersToInsert)
        .select('id, business_number')

      if (!error && newCustomers) {
        newCustomers.forEach((c: any) => {
          if (c.business_number) {
            customerMap.set(c.business_number, c.id)
            newCustomerCount++
          }
        })
      }
    }

    console.log(`✅ 고객 처리 완료: 신규 ${newCustomerCount}명, 업데이트 ${updatedCustomerCount}명`)
    
    // ===== 3단계: 세금계산서 upsert 처리 =====
    console.log('📄 세금계산서 처리 중...')

    // customer_id 필드 제거 및 데이터 준비
    const invoicesToUpsert = invoices.map((invoice: any) => {
      const { customer_id, ...invoiceData } = invoice
      return invoiceData
    })

    const invoiceBuyerNames = invoices.map((inv: any) => inv.buyer_company_name || '')

    console.log(`📊 처리 대상: ${invoicesToUpsert.length}건`)

    // upsert로 한 번에 처리 (중복은 DB가 자동 처리)
    const { data: upsertedInvoices, error } = await (supabase as any)
      .from('tax_invoices')
      .upsert(invoicesToUpsert, {
        onConflict: 'approval_number',
        ignoreDuplicates: true
      })
      .select('id, approval_number')

    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    if (error) {
      console.error('❌ 세금계산서 upsert 오류:', error)
      errorCount = invoicesToUpsert.length
    } else {
      successCount = upsertedInvoices?.length || 0
      skipCount = invoicesToUpsert.length - successCount
      console.log(`✅ 세금계산서 저장 완료: ${successCount}건 신규, ${skipCount}건 중복`)
    }

    const insertedInvoices = upsertedInvoices || []

    // ===== 4단계: 관계 테이블 처리 =====
    if (insertedInvoices.length > 0) {
      const relationsToInsert: any[] = []

      // 고객 매칭을 위한 정규화 함수
      const normalizeCompanyName = (name: string | null | undefined): string => {
        return (name || '').trim().toLowerCase()
      }

      // 사업자번호로 빠른 검색을 위한 Map 생성 (가장 확실한 매칭)
      const customersByBusinessNumber = new Map<string, string>() // business_number -> customer_id
      allExistingCustomers?.forEach(c => {
        if (c.business_number) {
          customersByBusinessNumber.set(c.business_number, c.id)
        }
      })

      // 회사명과 별칭으로 빠른 검색을 위한 Map 생성 (보조 매칭)
      const customersByName = new Map<string, string>() // normalized_name -> customer_id
      allExistingCustomers?.forEach(c => {
        // 회사명 매핑
        if (c.company_name) {
          customersByName.set(normalizeCompanyName(c.company_name), c.id)
        }
        // 별칭 매핑
        if (c.alias_names && Array.isArray(c.alias_names)) {
          c.alias_names.forEach(alias => {
            customersByName.set(normalizeCompanyName(alias), c.id)
          })
        }
      })

      // approval_number로 원본 인덱스 찾기
      const approvalToIndex = new Map<string, number>()
      invoicesToUpsert.forEach((inv: any, idx: number) => {
        approvalToIndex.set(inv.approval_number, idx)
      })

      // 원본 인보이스 데이터에서 buyer_business_number 추출을 위한 Map
      const approvalToBuyerBizNum = new Map<string, string>()
      invoices.forEach((inv: any) => {
        if (inv.approval_number && inv.buyer_business_number) {
          approvalToBuyerBizNum.set(inv.approval_number, inv.buyer_business_number)
        }
      })

      for (const invoice of insertedInvoices) {
        const index = approvalToIndex.get(invoice.approval_number) ?? -1
        if (index === -1) continue

        const buyerName = invoiceBuyerNames[index]
        const buyerBusinessNumber = approvalToBuyerBizNum.get(invoice.approval_number) || null
        const normalizedBuyerName = normalizeCompanyName(buyerName)

        // 고객 매칭 우선순위: 1. 사업자번호 (100% 확실) → 2. 회사명/별칭
        let customerId: string | null = null
        let matchMethod = ''

        if (buyerBusinessNumber) {
          customerId = customersByBusinessNumber.get(buyerBusinessNumber) || null
          if (customerId) {
            matchMethod = '사업자번호'
          }
        }

        // 사업자번호로 못 찾으면 회사명/별칭으로 시도
        if (!customerId) {
          customerId = customersByName.get(normalizedBuyerName) || null
          if (customerId) {
            matchMethod = '회사명/별칭'
          }
        }

        relationsToInsert.push({
          customer_id: customerId,
          tax_invoice_id: invoice.id
        })

        console.log(`세금계산서 연결: ${buyerName} (${buyerBusinessNumber || '사업자번호 없음'}) -> ${customerId ? `고객 찾음 (${matchMethod})` : '고객 없음'}`)
      }

      // 관계 테이블 upsert (기존 NULL 관계도 업데이트)
      if (relationsToInsert.length > 0) {
        const { error: relationError } = await (supabase as any)
          .from('customer_tax_invoices')
          .upsert(relationsToInsert, {
            onConflict: 'tax_invoice_id',
            ignoreDuplicates: false  // 기존 관계도 업데이트 (NULL → 실제 고객)
          })

        if (relationError) {
          console.error('❌ 관계 생성 오류:', relationError)
        } else {
          console.log(`✅ 관계 테이블 저장 완료: ${relationsToInsert.length}건`)
        }
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