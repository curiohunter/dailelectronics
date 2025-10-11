"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2Icon, FileTextIcon, TrendingUpIcon, ChevronLeft, ChevronRight, Banknote } from "lucide-react"

interface DashboardStatsProps {
  summary: {
    totalCustomers: number
    totalInvoiceAmount: number
    totalDepositAmount: number
    monthlyInvoiceTotal: number
    monthlyDepositTotal: number
    completedCount: number
    completedAmount: number
    unpaidCount: number
    unpaidAmount: number
    overpaidCount: number
    overpaidAmount: number
    topCustomers: Array<{
      name: string
      amount: number
    }>
    otherDeposits: {
      internal: { count: number; amount: number }
      external: { count: number; amount: number }
    }
    selectedMonth: Date
  }
  onMonthChange: (direction: 'prev' | 'next') => void
}

export function DashboardStats({ summary, onMonthChange }: DashboardStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Check if we're showing the current month (disable "next" button)
  const isCurrentMonth = () => {
    const now = new Date()
    const current = new Date(now.getFullYear(), now.getMonth(), 1)
    const selected = new Date(summary.selectedMonth.getFullYear(), summary.selectedMonth.getMonth(), 1)
    return selected >= current
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      {/* 1. 전체 거래업체 */}
      <Card className="md:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">전체 거래업체</CardTitle>
          <Building2Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalCustomers}개</div>
          <div className="mt-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">TOP 3 거래처</p>
            {summary.topCustomers.map((customer, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="truncate max-w-[120px]">{idx + 1}. {customer.name}</span>
                <span className="font-medium">{formatCurrency(customer.amount)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2. 전체 총액 (신규) */}
      <Card className="md:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">전체 총액</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">세금계산서</p>
              <div className="text-xl font-bold text-rose-500 dark:text-rose-400">{formatCurrency(summary.totalInvoiceAmount)}</div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">입금내역</p>
              <div className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(summary.totalDepositAmount)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. 수금 현황 */}
      <Card className="md:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">수금 현황</CardTitle>
            <p className="text-xs text-muted-foreground">
              청구 {formatCurrency(summary.totalInvoiceAmount)} / 수금 {Math.round(((summary.totalInvoiceAmount - summary.unpaidAmount) / summary.totalInvoiceAmount) * 100)}%
            </p>
          </div>
          <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-600 dark:text-green-400">✓ 완료</span>
              <span className="text-base font-bold text-green-600 dark:text-green-400">{formatCurrency(summary.completedAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-rose-500 dark:text-rose-400">⚠ 미수</span>
              <span className="text-base font-bold text-rose-500 dark:text-rose-400">{formatCurrency(summary.unpaidAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-600 dark:text-blue-400">↑ 과납</span>
              <span className="text-base font-bold text-blue-600 dark:text-blue-400">{formatCurrency(summary.overpaidAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. 월별 세금계산서 */}
      <Card className="md:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">월별 세금계산서</CardTitle>
          <FileTextIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onMonthChange('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {summary.selectedMonth.getFullYear()}년 {summary.selectedMonth.getMonth() + 1}월
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onMonthChange('next')}
              disabled={isCurrentMonth()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-2xl font-bold text-rose-500 dark:text-rose-400">
            {formatCurrency(summary.monthlyInvoiceTotal)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            월간 발행 총액
          </p>
        </CardContent>
      </Card>

      {/* 5. 월별 입금내역 (신규) */}
      <Card className="md:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">월별 입금내역</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onMonthChange('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {summary.selectedMonth.getFullYear()}년 {summary.selectedMonth.getMonth() + 1}월
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onMonthChange('next')}
              disabled={isCurrentMonth()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(summary.monthlyDepositTotal)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            월간 입금 총액
          </p>
        </CardContent>
      </Card>

      {/* 6. 월별 기타 입금 */}
      <Card className="md:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">월별 기타 입금</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onMonthChange('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {summary.selectedMonth.getFullYear()}년 {summary.selectedMonth.getMonth() + 1}월
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onMonthChange('next')}
              disabled={isCurrentMonth()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-2xl font-bold">
            {formatCurrency(summary.otherDeposits.internal.amount + summary.otherDeposits.external.amount)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            월간 기타 입금 총액
          </p>
        </CardContent>
      </Card>
    </div>
  )
}