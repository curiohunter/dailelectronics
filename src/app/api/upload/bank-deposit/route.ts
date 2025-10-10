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

    console.log('🚀 파일 파싱 시작...')
    const deposits = await FileParser.parseBankDepositFile(file)
    console.log(`📄 파싱 완료: ${deposits.length}건`)

    // ===== 1단계: 고객 목록 로드 =====
    console.log('📥 고객 목록 로드 중...')

    interface Customer {
      id: string
      company_name: string
      alias_names: string[] | null
    }

    const { data: customers } = await supabase
      .from('customers')
      .select('id, company_name, alias_names')
      .returns<Customer[]>()

    console.log(`✅ 고객 로드 완료: ${customers?.length || 0}명`)

    // ===== 2단계: 입금 내역 upsert 처리 =====
    console.log('💾 입금 내역 처리 중...')

    // customer_id 필드 제거 및 데이터 준비
    const depositsToUpsert = deposits.map((deposit: any) => {
      const { customer_id, ...depositData } = deposit
      return depositData
    })

    const depositNames = deposits.map((d: any) => d.deposit_name || '')

    console.log(`📊 처리 대상: ${depositsToUpsert.length}건`)

    // upsert로 한 번에 처리 (중복은 DB가 자동 처리)
    const { data: upsertedDeposits, error } = await (supabase as any)
      .from('bank_deposits')
      .upsert(depositsToUpsert, {
        onConflict: 'transaction_date,transaction_time,deposit_amount,deposit_name',
        ignoreDuplicates: true
      })
      .select('id')

    let successCount = 0
    let skipCount = 0
    let errorCount = 0
    const insertedDeposits: { id: string }[] = []

    if (error) {
      console.error('❌ 입금 내역 upsert 오류:', error)
      errorCount = depositsToUpsert.length
    } else {
      successCount = upsertedDeposits?.length || 0
      skipCount = depositsToUpsert.length - successCount
      insertedDeposits.push(...(upsertedDeposits || []))
      console.log(`✅ 입금 내역 저장 완료: ${successCount}건 신규, ${skipCount}건 중복`)
    }

    // ===== 3단계: 관계 테이블 처리 =====
    if (insertedDeposits.length > 0) {
      const relationsToInsert: any[] = []

      // 고객 매칭을 위한 정규화 함수
      const normalizeDepositName = (name: string | null | undefined): string => {
        return (name || '').trim().toLowerCase()
      }

      // 회사명과 별칭으로 빠른 검색을 위한 Map 생성
      const customersByName = new Map<string, string>() // normalized_name -> customer_id
      customers?.forEach(c => {
        // 회사명 매핑
        if (c.company_name) {
          customersByName.set(normalizeDepositName(c.company_name), c.id)
        }
        // 별칭 매핑
        if (c.alias_names && Array.isArray(c.alias_names)) {
          c.alias_names.forEach(alias => {
            customersByName.set(normalizeDepositName(alias), c.id)
          })
        }
      })

      for (let i = 0; i < insertedDeposits.length; i++) {
        const depositId = insertedDeposits[i].id
        const depositName = depositNames[i]
        const normalizedDepositName = normalizeDepositName(depositName)

        // 고객 매칭 (메모리에서)
        const customerId = customersByName.get(normalizedDepositName) || null

        relationsToInsert.push({
          customer_id: customerId,
          bank_deposit_id: depositId
        })

        console.log(`입금 연결: ${depositName} -> ${customerId ? '고객 찾음' : '고객 없음'}`)
      }

      // 관계 테이블 upsert (중복 방지)
      if (relationsToInsert.length > 0) {
        const { error: relationError } = await (supabase as any)
          .from('customer_bank_deposits')
          .upsert(relationsToInsert, {
            onConflict: 'bank_deposit_id',
            ignoreDuplicates: true
          })

        if (relationError) {
          console.error('❌ 관계 생성 오류:', relationError)
        } else {
          console.log(`✅ 관계 테이블 저장 완료: ${relationsToInsert.length}건`)
        }
      }
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