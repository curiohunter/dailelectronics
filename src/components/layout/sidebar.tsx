"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  Users,
  Link2,
  Settings,
  Moon,
  Sun,
  UserCog,
  LogOut
} from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

const navigation = [
  { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { name: "거래처", href: "/customers", icon: Users },
  { name: "매칭", href: "/matching", icon: Link2 },
  { name: "직원관리", href: "/employees", icon: UserCog },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      toast({
        title: "로그아웃 완료",
        description: "성공적으로 로그아웃되었습니다.",
      })
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "로그아웃 실패",
        description: "로그아웃 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 dark:bg-gray-950">
      <div className="flex h-16 items-center px-6">
        <h2 className="text-xl font-semibold text-white">다일전기</h2>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-800 text-white dark:bg-gray-800"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white dark:hover:bg-gray-800"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive
                    ? "text-white"
                    : "text-gray-400 group-hover:text-white"
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
      
      <div className="border-t border-gray-800 p-4">
        <div className="flex justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-gray-300 hover:text-white"
            title="테마 변경"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">테마 변경</span>
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-gray-300 hover:text-white hover:bg-red-800"
            title="로그아웃"
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">로그아웃</span>
          </Button>
        </div>
      </div>
    </div>
  )
}