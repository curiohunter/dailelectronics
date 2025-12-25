import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CustomerAdjustment {
  customerId: string
  companyName: string
  aliasNames?: string[]
  amount: number
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const { customers } = await request.json() as { customers: CustomerAdjustment[] }

    if (!customers || customers.length === 0) {
      return NextResponse.json(
        { error: '처리할 고객이 없습니다.' },
        { status: 400 }
      )
    }

    const today = new Date()
    const transactionDate = today.toISOString().split('T')[0]
    const transactionTime = today.toTimeString().split(' ')[0]

    const results: Array<{
      customerId: string
      companyName: string
      depositId: string
      amount: number
    }> = []
    const errors: Array<{
      customerId: string
      companyName: string
      error: string
    }> = []

    for (const customer of customers) {
      try {
        // 입금자명 결정: 회사명 우선, 없으면 첫번째 별칭
        const depositName = customer.companyName ||
                           (customer.aliasNames && customer.aliasNames[0]) ||
                           '알수없음'

        // 1. bank_deposits에 입금내역 생성
        const { data: deposit, error: depositError } = await (supabase as any)
          .from('bank_deposits')
          .insert({
            transaction_date: transactionDate,
            transaction_time: transactionTime,
            transaction_type: '잔액조정',
            deposit_amount: customer.amount,
            withdrawal_amount: 0,
            deposit_name: depositName,
            notes: '미수금 자동 정리'
          })
          .select('id')
          .single()

        if (depositError) throw depositError

        // 2. customer_bank_deposits에 관계 생성
        const { error: relationError } = await (supabase as any)
          .from('customer_bank_deposits')
          .insert({
            customer_id: customer.customerId,
            bank_deposit_id: deposit.id
          })

        if (relationError) throw relationError

        results.push({
          customerId: customer.customerId,
          companyName: customer.companyName,
          depositId: deposit.id,
          amount: customer.amount
        })

      } catch (error) {
        console.error(`고객 처리 오류 (${customer.companyName}):`, error)
        errors.push({
          customerId: customer.customerId,
          companyName: customer.companyName,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.length}개 업체 잔액 조정 완료${errors.length > 0 ? `, ${errors.length}개 오류` : ''}`,
      data: {
        processed: results.length,
        errors: errors.length,
        details: results
      }
    })

  } catch (error) {
    console.error('잔액 조정 오류:', error)
    return NextResponse.json(
      { error: '잔액 조정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
