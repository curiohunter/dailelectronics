"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import CustomerStatusTable from "@/components/CustomerStatusTable"
import CustomerPaymentStatus from "@/components/CustomerPaymentStatus"
import { Building2 } from "lucide-react"

interface MatchStatusSummary {
  totalCustomers: number
  customersWithUnmatchedDeposits: number
  unmatchedDepositsTotal: number
  customersWithUnmatchedInvoices: number
  unmatchedInvoicesTotal: number
  autoMatchedCount: number
}

interface CustomerStatus {
  customer_id: string
  customer_name: string
  total_invoices: number
  total_deposits: number
  matched_invoices: number
  matched_deposits: number
  unmatched_invoices: number
  unmatched_deposits: number
  invoice_amount: number
  deposit_amount: number
  matched_amount: number
  unmatched_invoice_amount: number
  unmatched_deposit_amount: number
  is_manual_matched: boolean
}

interface CustomerStatusSectionProps {
  matchStatusSummary: MatchStatusSummary
}

export function CustomerStatusSection({
  matchStatusSummary
}: CustomerStatusSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              거래처별 매칭 현황
            </CardTitle>
            <CardDescription>
              거래처별 세금계산서와 입금내역 매칭 상태
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              전체 {matchStatusSummary.totalCustomers}개사
            </Badge>
            <Badge variant="secondary" className="text-xs">
              미매칭 입금 {matchStatusSummary.customersWithUnmatchedDeposits}개사
            </Badge>
            <Badge variant="destructive" className="text-xs">
              미매칭 계산서 {matchStatusSummary.customersWithUnmatchedInvoices}개사
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CustomerStatusTable />
      </CardContent>
    </Card>
  )
}