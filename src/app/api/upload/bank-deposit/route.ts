import { NextRequest, NextResponse } from 'next/server'
import { FileParser } from '@/services/file-parser'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      )
    }
    
    // 파일 파싱
    const deposits = await FileParser.parseBankDepositFile(file)
    
    let successCount = 0
    let skipCount = 0
    let errorCount = 0
    
    for (const deposit of deposits) {
      // 중복 확인 (날짜, 시간, 금액, 입금자명 기준)
      const { data: existing } = await supabase
        .from('bank_deposits')
        .select('id')
        .eq('transaction_date', deposit.transaction_date)
        .eq('transaction_time', deposit.transaction_time || '')
        .eq('deposit_amount', deposit.deposit_amount)
        .eq('deposit_name', deposit.deposit_name || '')
        .single()
      
      if (existing) {
        skipCount++
        console.log(`중복 건너뜀: ${deposit.transaction_date} ${deposit.deposit_name} ${deposit.deposit_amount}원`)
        continue
      }
      
      // customer_id 필드 제거 (관계 테이블로 관리)
      const { customer_id, ...depositData } = deposit as any
      
      // 입금 내역 저장
      const { data: newDeposit, error } = await supabase
        .from('bank_deposits')
        .insert(depositData)
        .select('id')
        .single() as { data: { id: string } | null, error: any }
      
      if (error) {
        console.error('입금 내역 저장 오류:', error)
        errorCount++
        continue
      }
      
      // customer_bank_deposits 관계 생성
      if (newDeposit && deposit.deposit_name) {
        // 입금자명으로 고객 찾기 (회사명 또는 별칭과 매칭)
        interface Customer {
          id: string
          company_name: string
          alias_names: string[] | null
        }
        
        const { data: customers } = await supabase
          .from('customers')
          .select('id, company_name, alias_names')
          .returns<Customer[]>()
        
        // 입금자명과 매칭되는 고객 찾기
        const matchedCustomer = customers?.find(customer => {
          // 회사명과 일치하는지 확인
          if (customer.company_name === deposit.deposit_name) {
            return true
          }
          // 별칭과 일치하는지 확인
          if (deposit.deposit_name && customer.alias_names && customer.alias_names.includes(deposit.deposit_name)) {
            return true
          }
          return false
        })
        
        // 관계 테이블에 레코드 생성 (customer_id는 NULL 허용)
        const { error: relationError } = await supabase
          .from('customer_bank_deposits')
          .insert({
            customer_id: matchedCustomer?.id || null,
            bank_deposit_id: newDeposit.id
          } as any)
        
        if (relationError) {
          console.error('관계 생성 오류:', relationError)
        } else {
          console.log(`입금 연결: ${deposit.deposit_name} -> ${matchedCustomer ? matchedCustomer.company_name : '고객 없음'}`)
        }
      }
      
      successCount++
    }
    
    return NextResponse.json({
      success: true,
      message: `업로드 완료: ${successCount}건 저장, ${skipCount}건 중복, ${errorCount}건 오류`,
      data: {
        saved: successCount,
        skipped: skipCount,
        errors: errorCount,
        total: deposits.length
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