'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatKRW, formatDate } from '@/lib/utils'
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  UserPlus,
  Calendar,
  Filter,
  XCircle
} from 'lucide-react'

interface BankDeposit {
  id: string
  transaction_date: string
  deposit_name: string
  deposit_amount: number
  remaining_amount: number
  is_matched: boolean
  is_partially_matched: boolean
  matched_invoice_id?: string
  created_at: string
  updated_at: string
}

interface Customer {
  id: string
  company_name: string
  alias_names: string[]
}

export default function DepositHistoryTable() {
  const supabase = createClient()
  const [deposits, setDeposits] = useState<BankDeposit[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  
  // 필터
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'matched' | 'partial' | 'unmatched'>('all')
  
  // 수정/삭제
  const [editingDeposit, setEditingDeposit] = useState<BankDeposit | null>(null)
  const [deletingDeposit, setDeletingDeposit] = useState<BankDeposit | null>(null)
  const [assigningAlias, setAssigningAlias] = useState<BankDeposit | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  
  // 수정 폼
  const [editForm, setEditForm] = useState({
    transaction_date: '',
    deposit_name: '',
    deposit_amount: 0
  })

  useEffect(() => {
    fetchDeposits()
    fetchCustomers()
  }, [currentPage, pageSize, searchTerm, dateFrom, dateTo, statusFilter])

  const fetchDeposits = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('bank_deposits')
        .select('*', { count: 'exact' })
        .order('transaction_date', { ascending: false })
      
      // 검색어 필터
      if (searchTerm) {
        query = query.ilike('deposit_name', `%${searchTerm}%`)
      }
      
      // 날짜 필터
      if (dateFrom) {
        query = query.gte('transaction_date', dateFrom)
      }
      if (dateTo) {
        query = query.lte('transaction_date', dateTo)
      }
      
      // 상태 필터
      if (statusFilter === 'matched') {
        query = query.eq('is_matched', true)
      } else if (statusFilter === 'partial') {
        query = query.eq('is_partially_matched', true)
      } else if (statusFilter === 'unmatched') {
        query = query.eq('is_matched', false).eq('is_partially_matched', false)
      }
      
      const { data, count, error } = await query
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)
      
      if (error) throw error
      
      setDeposits(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('입금 내역 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const { data } = await supabase
        .from('customers')
        .select('id, company_name, alias_names')
        .order('company_name')
      
      setCustomers(data || [])
    } catch (error) {
      console.error('고객 목록 조회 오류:', error)
    }
  }

  const handleEdit = (deposit: BankDeposit) => {
    setEditingDeposit(deposit)
    setEditForm({
      transaction_date: deposit.transaction_date,
      deposit_name: deposit.deposit_name,
      deposit_amount: deposit.deposit_amount
    })
  }

  const handleSaveEdit = async () => {
    if (!editingDeposit) return
    
    try {
      const { error } = await (supabase as any)
        .from('bank_deposits')
        .update({
          transaction_date: editForm.transaction_date,
          deposit_name: editForm.deposit_name,
          deposit_amount: editForm.deposit_amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingDeposit.id)
      
      if (error) throw error
      
      alert('수정되었습니다.')
      setEditingDeposit(null)
      fetchDeposits()
    } catch (error) {
      console.error('수정 오류:', error)
      alert('수정 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async () => {
    if (!deletingDeposit) return
    
    try {
      // 먼저 관련 매칭 삭제
      await supabase
        .from('payment_matching')
        .delete()
        .eq('bank_deposit_id', deletingDeposit.id)
      
      // 입금 삭제
      const { error } = await (supabase as any)
        .from('bank_deposits')
        .delete()
        .eq('id', deletingDeposit.id)
      
      if (error) throw error
      
      alert('삭제되었습니다.')
      setDeletingDeposit(null)
      fetchDeposits()
    } catch (error) {
      console.error('삭제 오류:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleAssignAlias = async () => {
    if (!assigningAlias || !selectedCustomerId) return
    
    try {
      // 선택한 고객 정보 가져오기
      interface CustomerData {
        company_name: string
        alias_names: string[] | null
        notes?: string | null
      }
      
      const { data: customerData } = await supabase
        .from('customers')
        .select('company_name, alias_names, notes')
        .eq('id', selectedCustomerId)
        .single()
      
      const customer = customerData as CustomerData | null
      
      if (!customer) {
        alert('고객을 찾을 수 없습니다.')
        return
      }
      
      const depositName = assigningAlias.deposit_name.trim()
      const existingAliases = customer.alias_names || []
      
      // 이미 있는 별칭인지 확인
      if (customer.company_name === depositName || existingAliases.includes(depositName)) {
        alert('이미 등록된 이름입니다.')
        return
      }
      
      // 별칭 추가
      const updatedAliases = [...existingAliases, depositName]
      
      const { error } = await (supabase as any)
        .from('customers')
        .update({ 
          alias_names: updatedAliases,
          notes: `${customer.notes || ''}\n[수동 추가] ${new Date().toLocaleDateString('ko-KR')}: 입금자명 '${depositName}' 추가됨`.trim()
        })
        .eq('id', selectedCustomerId)
      
      if (error) throw error
      
      alert(`${customer.company_name}에 '${depositName}' 별칭이 추가되었습니다.`)
      
      // 자동 매칭 실행
      try {
        const response = await fetch('/api/matching/auto-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        
        const result = await response.json()
        
        if (result.success && result.matchedCount > 0) {
          alert(`${result.matchedCount}건의 세금계산서가 자동으로 매칭되었습니다.`)
          fetchDeposits() // 입금 내역 새로고침
        }
      } catch (error) {
        console.error('Auto matching error:', error)
      }
      
      setAssigningAlias(null)
      setSelectedCustomerId('')
    } catch (error) {
      console.error('별칭 추가 오류:', error)
      alert('별칭 추가 중 오류가 발생했습니다.')
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const getStatusBadge = (deposit: BankDeposit) => {
    if (deposit.is_matched) {
      return <Badge className="bg-green-500/10 text-green-700 border-green-200 text-xs">완료</Badge>
    } else if (deposit.is_partially_matched) {
      return <Badge className="bg-amber-500/10 text-amber-700 border-amber-200 text-xs">부분</Badge>
    } else {
      return <Badge className="bg-gray-500/10 text-gray-700 border-gray-200 text-xs">미매칭</Badge>
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>입금 내역</CardTitle>
            <Button onClick={fetchDeposits} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
          </div>
          
          {/* 필터 */}
          <div className="flex flex-wrap gap-2 mt-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">필터:</span>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="입금자명 검색..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 w-[200px] h-9"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-[140px] h-9"
                placeholder="시작일"
              />
              <span className="text-sm text-muted-foreground">~</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-[140px] h-9"
                placeholder="종료일"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value: any) => {
              setStatusFilter(value)
              setCurrentPage(1)
            }}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="matched">완료</SelectItem>
                <SelectItem value="partial">부분매칭</SelectItem>
                <SelectItem value="unmatched">미매칭</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={pageSize.toString()} onValueChange={(value) => {
              setPageSize(Number(value))
              setCurrentPage(1)
            }}>
              <SelectTrigger className="w-[100px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10개</SelectItem>
                <SelectItem value="20">20개</SelectItem>
                <SelectItem value="50">50개</SelectItem>
                <SelectItem value="100">100개</SelectItem>
              </SelectContent>
            </Select>
            
            {(searchTerm || dateFrom || dateTo || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-2"
                onClick={() => {
                  setSearchTerm('')
                  setDateFrom('')
                  setDateTo('')
                  setStatusFilter('all')
                  setCurrentPage(1)
                }}
              >
                <XCircle className="h-4 w-4 mr-1" />
                초기화
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[12%] py-3 px-4">입금일</TableHead>
                <TableHead className="w-[20%] py-3 px-4">입금자명</TableHead>
                <TableHead className="w-[14%] py-3 px-4 text-right">입금액</TableHead>
                <TableHead className="w-[14%] py-3 px-4 text-right">사용액</TableHead>
                <TableHead className="w-[14%] py-3 px-4 text-right">잔액</TableHead>
                <TableHead className="w-[10%] py-3 px-4 text-center">상태</TableHead>
                <TableHead className="w-[16%] py-3 px-4 text-center">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.map((deposit) => (
                <TableRow key={deposit.id} className="hover:bg-muted/30">
                  <TableCell className="py-3 px-4">
                    <div className="text-sm">
                      {formatDate(deposit.transaction_date)}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <div className="font-medium text-sm">
                      {deposit.deposit_name}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right">
                    <div className="text-sm font-semibold">
                      {formatKRW(deposit.deposit_amount)}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right">
                    <div className="text-sm text-green-600">
                      {formatKRW(deposit.deposit_amount - deposit.remaining_amount)}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right">
                    <div className={`text-sm font-semibold ${
                      deposit.remaining_amount > 0 ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {formatKRW(deposit.remaining_amount)}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-center">
                    {getStatusBadge(deposit)}
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEdit(deposit)}
                        title="수정"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setAssigningAlias(deposit)}
                        title="업체 할당"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={() => setDeletingDeposit(deposit)}
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {deposits.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-lg">입금 내역이 없습니다</div>
            </div>
          )}
          
          {/* 페이지네이션 */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                총 {totalCount}개 중 {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, totalCount)}개 표시
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="text-sm px-2">
                  {currentPage} / {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 수정 다이얼로그 */}
      <Dialog open={!!editingDeposit} onOpenChange={() => setEditingDeposit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>입금 내역 수정</DialogTitle>
            <DialogDescription>
              입금 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">입금일</label>
              <Input
                type="date"
                value={editForm.transaction_date}
                onChange={(e) => setEditForm({ ...editForm, transaction_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">입금자명</label>
              <Input
                value={editForm.deposit_name}
                onChange={(e) => setEditForm({ ...editForm, deposit_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">입금액</label>
              <Input
                type="number"
                value={editForm.deposit_amount}
                onChange={(e) => setEditForm({ ...editForm, deposit_amount: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDeposit(null)}>
              취소
            </Button>
            <Button onClick={handleSaveEdit}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={!!deletingDeposit} onOpenChange={() => setDeletingDeposit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>입금 내역 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 입금 내역을 삭제하시겠습니까?
              <br />
              관련된 매칭 정보도 함께 삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          {deletingDeposit && (
            <div className="py-4 space-y-2">
              <p className="text-sm">입금일: {formatDate(deletingDeposit.transaction_date)}</p>
              <p className="text-sm">입금자명: {deletingDeposit.deposit_name}</p>
              <p className="text-sm">입금액: {formatKRW(deletingDeposit.deposit_amount)}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingDeposit(null)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 업체 할당 다이얼로그 */}
      <Dialog open={!!assigningAlias} onOpenChange={() => {
        setAssigningAlias(null)
        setSelectedCustomerId('')
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>업체에 입금자명 추가</DialogTitle>
            <DialogDescription>
              입금자명을 선택한 업체의 별칭으로 추가합니다.
            </DialogDescription>
          </DialogHeader>
          {assigningAlias && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">입금자명</p>
                <p className="text-lg font-semibold">{assigningAlias.deposit_name}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">업체 선택</label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="업체를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.company_name}
                        {customer.alias_names?.length > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (별칭: {customer.alias_names.join(', ')})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAssigningAlias(null)
              setSelectedCustomerId('')
            }}>
              취소
            </Button>
            <Button onClick={handleAssignAlias} disabled={!selectedCustomerId}>
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}