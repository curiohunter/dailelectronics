"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2Icon, FileTextIcon, TrendingUpIcon, ChevronLeft, ChevronRight, Banknote } from "lucide-react"

interface DashboardStatsProps {
  summary: {
    totalCustomers: number
    monthlyInvoiceTotal: number
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          <div className="text-2xl font-bold">
            {formatCurrency(summary.monthlyInvoiceTotal)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            월간 발행 총액
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">수금 현황</CardTitle>
          <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-green-600">✓ 완료</span>
              <div className="text-right">
                <div className="font-medium">{summary.completedCount}개</div>
                <div className="text-xs text-muted-foreground">{formatCurrency(summary.completedAmount)}</div>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-600">⚠ 미수</span>
              <div className="text-right">
                <div className="font-medium">{summary.unpaidCount}개</div>
                <div className="text-xs text-muted-foreground">{formatCurrency(summary.unpaidAmount)}</div>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-600">↑ 과납</span>
              <div className="text-right">
                <div className="font-medium">{summary.overpaidCount}개</div>
                <div className="text-xs text-muted-foreground">{formatCurrency(summary.overpaidAmount)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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