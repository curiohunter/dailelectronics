import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 현재 사용자가 관리자인지 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: currentEmployee } = await supabase
      .from('employees')
      .select('is_admin')
      .eq('auth_user_id', user.id)
      .single()

    if (!currentEmployee?.is_admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    // 삭제할 사용자 ID 가져오기
    const { authUserId } = await request.json()

    // Service Role Key를 사용한 Admin 클라이언트 생성
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Service role key not configured')
      return NextResponse.json({
        success: false,
        message: 'Auth 사용자는 삭제할 수 없습니다. Service role key가 설정되지 않았습니다.'
      })
    }

    // Admin 클라이언트로 Auth 사용자 삭제
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { error } = await supabaseAdmin.auth.admin.deleteUser(authUserId)

    if (error) {
      console.error('Failed to delete auth user:', error)
      return NextResponse.json({
        success: false,
        message: 'Auth 사용자 삭제 실패. employees 테이블에서만 삭제됩니다.'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Auth 사용자와 employee 레코드가 모두 삭제되었습니다.'
    })
  } catch (error) {
    console.error('Error deleting auth user:', error)
    return NextResponse.json(
      { error: 'Failed to delete auth user' },
      { status: 500 }
    )
  }
}