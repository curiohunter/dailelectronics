'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('올바른 이메일 형식이 아닙니다')
      }

      // Check if this is the first user
      // RLS 정책 때문에 count가 안 나올 수 있으므로 직접 데이터 조회
      const { data: existingEmployees, error: countError } = await supabase
        .from('employees')
        .select('id')
        .limit(1)


      const isFirstUser = !existingEmployees || existingEmployees.length === 0

      // Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(), // 이메일 정규화
        password,
        options: {
          data: {
            name,
            phone
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (authError) {
        // 더 친화적인 에러 메시지
        if (authError.message.includes('invalid')) {
          throw new Error('이메일 주소가 올바르지 않습니다. 실제 이메일 주소를 입력해주세요.')
        } else if (authError.message.includes('already registered')) {
          throw new Error('이미 등록된 이메일입니다.')
        }
        throw authError
      }

      if (authData.user) {
        // Create employee record
        const { error: employeeError } = await supabase
          .from('employees')
          .insert({
            email,
            name,
            phone,
            auth_user_id: authData.user.id,
            is_admin: isFirstUser,
            is_active: isFirstUser // 첫 번째 사용자만 자동 활성화
          })

        if (employeeError) throw employeeError

        // Auto sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (signInError) throw signInError

        // Redirect based on activation status
        if (isFirstUser) {
          router.push('/dashboard')
        } else {
          router.push('/unauthorized') // 승인 대기 페이지로 이동
        }
      }
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || '회원가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            회원가입
          </CardTitle>
          <CardDescription className="text-center">
            계정을 생성하여 시스템을 사용하세요
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일 *</Label>
              <Input
                id="email"
                type="email"
                placeholder="실제 이메일 주소를 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                title="올바른 이메일 형식을 입력해주세요"
              />
              <p className="text-xs text-muted-foreground">
                * 실제 사용 가능한 이메일 주소를 입력해주세요
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호 *</Label>
              <Input
                id="password"
                type="password"
                placeholder="최소 6자 이상"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">전화번호 (선택)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="010-1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  회원가입 중...
                </>
              ) : (
                '회원가입'
              )}
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-primary hover:underline">
                로그인
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}