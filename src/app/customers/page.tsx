"use client"

import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"

export default function CustomersPage() {
  const router = useRouter()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">거래처 분석 대시보드</h1>
          <p className="text-muted-foreground">
            거래처별 통계 분석 및 인사이트를 제공합니다.
          </p>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium">
              🚧 개발 중 - 새로운 거래처 분석 기능을 준비하고 있습니다.
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              계획: 거래처 등급(A/B/C/D), 매출 추이 분석, 리스크 관리, 영업 인사이트 제공
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              상세 계획서: /docs/customer-analytics-plan.md
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={() => router.push('/matching?tab=customers')}
            size="sm"
          >
            <ArrowUpRight className="h-4 w-4 mr-2" />
            거래처 관리 페이지로 이동
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}