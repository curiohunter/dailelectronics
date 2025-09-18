'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { Loader2, UserCheck, UserX } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/types/database.types'

type Employee = Database['public']['Tables']['employees']['Row']

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast({
        title: '오류',
        description: '직원 목록을 불러오는데 실패했습니다',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (employee: Employee) => {
    try {
      const { error } = await (supabase as any)
        .from('employees')
        .update({ is_active: !employee.is_active })
        .eq('id', employee.id)

      if (error) throw error

      toast({
        title: '성공',
        description: `${employee.name}님의 상태가 변경되었습니다`,
      })
      fetchEmployees()
    } catch (error) {
      console.error('Error updating employee:', error)
      toast({
        title: '오류',
        description: '상태 변경에 실패했습니다',
        variant: 'destructive'
      })
    }
  }

  const handleToggleAdmin = async (employee: Employee) => {
    try {
      const { error } = await (supabase as any)
        .from('employees')
        .update({ is_admin: !employee.is_admin })
        .eq('id', employee.id)

      if (error) throw error

      toast({
        title: '성공',
        description: `${employee.name}님의 권한이 변경되었습니다`,
      })
      fetchEmployees()
    } catch (error) {
      console.error('Error updating employee:', error)
      toast({
        title: '오류',
        description: '권한 변경에 실패했습니다',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`정말 ${employee.name}님을 완전히 삭제하시겠습니까?\n\n⚠️ 주의사항:\n• 이 직원의 모든 데이터가 삭제됩니다\n• 해당 계정으로 다시 로그인할 수 없습니다\n• 이 작업은 되돌릴 수 없습니다`)) {
      return
    }

    try {
      let authDeleted = false

      // Supabase Auth에서 사용자 삭제 시도
      if (employee.auth_user_id) {
        const response = await fetch('/api/employees/delete-auth', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authUserId: employee.auth_user_id })
        })

        const result = await response.json()
        authDeleted = result.success

        if (!authDeleted) {
          console.warn('Auth 사용자 삭제 실패:', result.message)
        }
      }

      // employees 테이블에서 삭제
      const { error } = await (supabase as any)
        .from('employees')
        .delete()
        .eq('id', employee.id)

      if (error) throw error

      // 삭제 결과에 따라 다른 메시지 표시
      if (authDeleted) {
        toast({
          title: '✅ 완전 삭제 성공',
          description: '직원 계정이 완전히 삭제되었습니다 (Auth + DB)',
        })
      } else {
        toast({
          title: '⚠️ 부분 삭제',
          description: 'employees 테이블에서만 삭제되었습니다. Auth 계정은 남아있을 수 있습니다.',
          variant: 'default'
        })
      }

      fetchEmployees()
    } catch (error) {
      console.error('Error deleting employee:', error)
      toast({
        title: '오류',
        description: '삭제에 실패했습니다',
        variant: 'destructive'
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">직원 관리</h1>
            <p className="text-muted-foreground">
              시스템 사용자를 관리합니다
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>직원 목록</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                등록된 직원이 없습니다.
                <br />
                <span className="text-sm">회원가입을 통해 직원을 추가하세요.</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>전화번호</TableHead>
                    <TableHead>권한</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>가입일</TableHead>
                    <TableHead className="text-center">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee, index) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        {employee.name}
                        {index === 0 && (
                          <Badge variant="secondary" className="ml-2">
                            초기 관리자
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.phone || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={employee.is_admin || false}
                            onCheckedChange={() => handleToggleAdmin(employee)}
                            disabled={index === 0} // Prevent changing first admin
                          />
                          <span className="text-sm">
                            {employee.is_admin ? '관리자' : '일반'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={employee.is_active || false}
                            onCheckedChange={() => handleToggleActive(employee)}
                          />
                          {employee.is_active ? (
                            <Badge variant="default" className="bg-green-600">
                              <UserCheck className="w-3 h-3 mr-1" />
                              활성
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <UserX className="w-3 h-3 mr-1" />
                              비활성
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {employee.created_at ? new Date(employee.created_at).toLocaleDateString('ko-KR') : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(employee)}
                          disabled={index === 0} // Prevent deleting first admin
                        >
                          삭제
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>🔐 권한 관리 안내:</strong>
                <br />
                • 새로 가입한 직원은 <strong>비활성</strong> 상태로 시작됩니다
                <br />
                • 관리자가 직원을 <strong>활성화</strong>해야 시스템에 접근 가능합니다
                <br />
                • 첫 번째 가입자는 자동으로 관리자가 되며 보호됩니다
                <br />
                • 삭제 버튼으로 직원 계정을 완전히 제거할 수 있습니다
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}