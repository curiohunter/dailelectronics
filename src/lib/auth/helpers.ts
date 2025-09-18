import { createClient } from '@/lib/supabase/server'

export async function getCurrentEmployee() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('auth_user_id', user.id)
    .single() as { data: any, error: any }

  return employee
}

export async function requireAuth() {
  const employee = await getCurrentEmployee()
  
  if (!employee || !employee.is_active) {
    throw new Error('Unauthorized')
  }
  
  return employee
}

export async function requireAdmin() {
  const employee = await getCurrentEmployee()
  
  if (!employee || !employee.is_admin || !employee.is_active) {
    throw new Error('Admin access required')
  }
  
  return employee
}