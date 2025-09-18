import { login } from './actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            다일전기
          </CardTitle>
          <CardDescription className="text-center">
            직원 전용 시스템
          </CardDescription>
        </CardHeader>
        
        <form action={login}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@dail-electric.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full">
              로그인
            </Button>
            
            <div className="text-sm text-center text-gray-600">
              처음 방문하셨나요?{' '}
              <Link href="/signup" className="text-blue-600 hover:underline">
                초대 코드로 가입하기
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}