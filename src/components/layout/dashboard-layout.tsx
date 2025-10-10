"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { ReceivablesSidebar } from "./receivables-sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { Button } from "@/components/ui/button"
import { TrendingDown } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { leftSidebarOpen, rightSidebarOpen, toggleLeftSidebar, toggleRightSidebar } = useSidebar()

  // 매칭 페이지에서만 오른쪽 사이드바 표시
  const showRightSidebar = pathname === '/matching'

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* 왼쪽 사이드바 */}
      <Sidebar collapsed={!leftSidebarOpen} onToggle={toggleLeftSidebar} />

      {/* 메인 컨텐츠 */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="p-8">
          {children}
        </div>

        {/* 플로팅 토글 버튼 (오른쪽 사이드바가 닫혀있을 때만) */}
        {showRightSidebar && !rightSidebarOpen && (
          <Button
            onClick={toggleRightSidebar}
            className="fixed top-4 right-4 bg-red-600 hover:bg-red-700 text-white shadow-lg"
            size="sm"
          >
            <TrendingDown className="mr-2 h-4 w-4" />
            미수금 현황
          </Button>
        )}
      </main>

      {/* 오른쪽 사이드바 (매칭 페이지에서만) */}
      {showRightSidebar && (
        <ReceivablesSidebar collapsed={!rightSidebarOpen} onToggle={toggleRightSidebar} />
      )}
    </div>
  )
}