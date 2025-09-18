'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function UnauthorizedPage() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 p-3">
              <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            접근 권한 대기 중
          </CardTitle>
          <CardDescription className="text-base">
            회원가입이 완료되었습니다.
            관리자의 승인을 기다려 주세요.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>안내사항:</strong><br />
              • 관리자가 귀하의 계정을 검토 중입니다<br />
              • 승인 후 모든 기능을 사용하실 수 있습니다<br />
              • 문의사항은 관리자에게 연락해 주세요
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => window.location.reload()}
            >
              새로고침
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            승인 완료 후 새로고침하면 자동으로 접속됩니다
          </div>
        </CardContent>
      </Card>
    </div>
  )
}