import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => 
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 중요: createServerClient와 getUser() 사이에 코드 작성 금지
  const { data: { user } } = await supabase.auth.getUser()

  // 비로그인 사용자 리다이렉트 (랜딩, 로그인, 회원가입 페이지만 허용)
  const publicPaths = ['/', '/login', '/signup']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname === path)

  // API routes and auth callbacks should be allowed
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth')

  if (!user && !isPublicPath && !isApiRoute && !isAuthCallback) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 로그인한 사용자의 권한 체크 (protected routes)
  const protectedPaths = ['/dashboard', '/matching', '/customers', '/employees']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (user && isProtectedPath) {
    // employees 테이블에서 사용자 정보 확인
    const { data: employee, error } = await supabase
      .from('employees')
      .select('is_active, is_admin, updated_at')
      .eq('auth_user_id', user.id)
      .single()

    // 직원 정보가 없거나 비활성 상태면 접근 거부
    if (!employee || !employee.is_active) {
      const url = request.nextUrl.clone()
      url.pathname = '/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  // 로그인한 사용자가 로그인/회원가입 페이지 접근 시 대시보드로 리다이렉트
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}