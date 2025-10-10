'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { X, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAllData } from '@/hooks/use-data'

interface ReceivablesSidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function ReceivablesSidebar({ collapsed = true, onToggle }: ReceivablesSidebarProps) {
  const { data: apiData, isLoading } = useAllData()

  // 미수금 고객사 계산 및 정렬
  const unpaidCustomers = useMemo(() => {
    if (!apiData || !apiData.success) {
      return []
    }

    const customers = apiData.data.customers
    const invoices = apiData.data.taxInvoices
    const deposits = apiData.data.bankDeposits
    const invoiceRelations = apiData.data.invoiceRelations
    const depositRelations = apiData.data.depositRelations

    // 고객사별 미수금 계산
    const customerMap = new Map()

    customers?.forEach(customer => {
      customerMap.set(customer.id, {
        id: customer.id,
        companyName: customer.company_name,
        representativeName: customer.representative_name,
        invoiceAmount: 0,
        depositAmount: 0,
        balance: 0,
        oldestUnpaidDate: null,
        overdueDays: null,
      })
    })

    // 세금계산서 합계
    invoiceRelations?.forEach(rel => {
      const invoice = invoices?.find(inv => inv.id === rel.tax_invoice_id)
      if (invoice && rel.customer_id) {
        const customer = customerMap.get(rel.customer_id)
        if (customer) {
          customer.invoiceAmount += invoice.total_amount
        }
      }
    })

    // 입금 합계
    depositRelations?.forEach(rel => {
      const deposit = deposits?.find(dep => dep.id === rel.bank_deposit_id)
      if (deposit && rel.customer_id) {
        const customer = customerMap.get(rel.customer_id)
        if (customer) {
          customer.depositAmount += deposit.deposit_amount
        }
      }
    })

    // 미수금 계산 및 경과일 계산
    const today = new Date()
    const unpaid: any[] = []

    customerMap.forEach((customer, customerId) => {
      customer.balance = customer.depositAmount - customer.invoiceAmount

      // 미수금인 경우만 추가
      if (customer.balance < 0) {
        // FIFO로 가장 오래된 미지급 세금계산서 찾기
        const customerInvoices = invoices
          ?.filter(inv => {
            const rel = invoiceRelations?.find(r => r.tax_invoice_id === inv.id)
            return rel?.customer_id === customerId
          })
          .sort((a, b) => new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime())

        let remainingDeposit = customer.depositAmount
        let oldestUnpaidDate = null

        for (const invoice of customerInvoices || []) {
          if (remainingDeposit >= invoice.total_amount) {
            remainingDeposit -= invoice.total_amount
          } else {
            oldestUnpaidDate = invoice.issue_date
            break
          }
        }

        if (oldestUnpaidDate) {
          const unpaidDate = new Date(oldestUnpaidDate)
          const diffTime = today.getTime() - unpaidDate.getTime()
          customer.overdueDays = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0
          customer.oldestUnpaidDate = oldestUnpaidDate
        }

        unpaid.push(customer)
      }
    })

    // 미수금액 큰 순서로 정렬
    return unpaid.sort((a, b) => a.balance - b.balance)
  }, [apiData])

  // 숨겨진 상태면 렌더링하지 않음
  if (collapsed) {
    return null
  }

  return (
    <div className="flex h-full w-50 flex-col bg-gray-900 dark:bg-gray-950 transition-all duration-300 border-l border-gray-800">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-red-400" />
          <h2 className="text-lg font-semibold text-white">미수금 현황</h2>
        </div>
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-gray-300 hover:text-white hover:bg-gray-800"
            title="사이드바 접기"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-400 text-sm">로딩 중...</div>
          </div>
        ) : unpaidCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <TrendingDown className="h-8 w-8 text-gray-600 mb-2" />
            <div className="text-gray-400 text-sm">미수금이 없습니다</div>
          </div>
        ) : (
          <div className="space-y-3">
            {unpaidCustomers.map((customer) => (
              <div
                key={customer.id}
                className="bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <div className="flex flex-col gap-1">
                  {/* 회사명 (대표자명) */}
                  <div className="text-sm font-medium text-white">
                    {customer.companyName}
                    {customer.representativeName && (
                      <span className="text-gray-400 font-normal ml-1">
                        ({customer.representativeName})
                      </span>
                    )}
                  </div>

                  {/* 미수금액 */}
                  <div className="text-lg font-bold text-red-400">
                    ₩{Math.abs(customer.balance).toLocaleString()}
                  </div>

                  {/* 경과일수 */}
                  {customer.overdueDays !== null && (
                    <div className="text-xs text-gray-500">
                      {customer.overdueDays}일 경과
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
