'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import { formatKRW, formatDate } from '@/lib/utils'
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Search,
  RefreshCw
} from 'lucide-react'

interface CustomerStatus {
  customer_id: string
  company_name: string
  total_invoice_amount: number
  total_received_amount: number
  total_remaining: number
  invoice_count: number
  deposit_count: number
  payment_rate: number
}

export default function CustomerStatusTable() {
  const supabase = createClient()
  const [statuses, setStatuses] = useState<CustomerStatus[]>([])
  const [loading, setLoading] = useState(true)
  
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  
  // 필터
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'unpaid' | 'overpaid'>('all')

  useEffect(() => {
    fetchCustomerStatuses()
  }, [currentPage, pageSize, searchTerm, statusFilter])

  const fetchCustomerStatuses = async () => {
    try {
      setLoading(true)
      
      // 모든 고객 조회
      let customersQuery = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .order('company_name')
      
      if (searchTerm) {
        customersQuery = customersQuery.ilike('company_name', `%${searchTerm}%`)
      }
      
      interface Customer {
        id: string
        company_name: string
        alias_names: string[] | null
        [key: string]: any
      }
      
      const { data: customersData, count } = await customersQuery
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)
      
      const customers = customersData as Customer[] | null
      
      setTotalCount(count || 0)
      
      // 각 고객별 통계 계산
      const statusPromises = (customers || []).map(async (customer) => {
        // 세금계산서 조회 - customer_id 또는 buyer_company_name으로 조회
        const aliases = customer.alias_names || []
        const names = [customer.company_name, ...aliases].filter(Boolean)
        
        interface Invoice {
          total_amount: number
          remaining_amount: number
          matched_amount: number
        }
        
        const { data: invoicesData } = await supabase
          .from('tax_invoices')
          .select('total_amount, remaining_amount, matched_amount')
          .or(names.map(name => `buyer_company_name.eq.${name}`).join(','))
        
        const invoices = invoicesData as Invoice[] | null
        
        // 관련 입금 조회
        interface Deposit {
          deposit_amount: number
          remaining_amount: number
          deposit_name: string | null
        }
        
        const { data: depositsData } = await supabase
          .from('bank_deposits')
          .select('deposit_amount, remaining_amount, deposit_name')
        
        const deposits = depositsData as Deposit[] | null
        
        const relatedDeposits = deposits?.filter(deposit => {
          const depositName = deposit.deposit_name?.toLowerCase() || ''
          return names.some(name => {
            const nameClean = name.toLowerCase()
            return depositName.includes(nameClean) || nameClean.includes(depositName)
          })
        }) || []
        
        const totalInvoice = invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0
        const totalReceived = invoices?.reduce((sum, inv) => sum + inv.matched_amount, 0) || 0
        const totalRemaining = invoices?.reduce((sum, inv) => sum + inv.remaining_amount, 0) || 0
        
        // 해당 고객의 총 입금액 (관련 입금만)
        const totalDeposit = relatedDeposits.reduce((sum, dep) => sum + dep.deposit_amount, 0)
        
        // 수금률 계산: 받은 금액(matched_amount) / 총 세금계산서 금액
        const paymentRate = totalInvoice > 0 ? (totalReceived / totalInvoice) * 100 : 
                           totalReceived > 0 ? 100 : 0
        
        return {
          customer_id: customer.id,
          company_name: customer.company_name,
          total_invoice_amount: totalInvoice,
          total_received_amount: totalDeposit,  // 해당 고객의 총 입금액
          total_remaining: totalRemaining,
          invoice_count: invoices?.length || 0,
          deposit_count: relatedDeposits.length,  // 해당 고객의 입금 건수
          payment_rate: paymentRate
        }
      })
      
      const allStatuses = await Promise.all(statusPromises)
      
      // 필터 적용
      let filteredStatuses = allStatuses
      if (statusFilter === 'complete') {
        filteredStatuses = allStatuses.filter(s => 
          s.total_remaining === 0 && 
          s.total_invoice_amount > 0 && 
          s.total_received_amount === s.total_invoice_amount
        )
      } else if (statusFilter === 'unpaid') {
        filteredStatuses = allStatuses.filter(s => 
          s.total_remaining > 0 && 
          s.total_invoice_amount > 0
        )
      } else if (statusFilter === 'overpaid') {
        filteredStatuses = allStatuses.filter(s => 
          s.total_received_amount > s.total_invoice_amount && 
          s.total_invoice_amount > 0
        )
      }
      
      setStatuses(filteredStatuses)
    } catch (error) {
      console.error('Error fetching customer statuses:', error)
    } finally {
      setLoading(false)
    }
  }


  const totalPages = Math.ceil(totalCount / pageSize)

  const getStatusBadge = (status: CustomerStatus) => {
    if (status.total_invoice_amount === 0) {
      return <Badge variant="outline" className="text-xs">거래없음</Badge>
    } else if (status.total_remaining === 0 && status.total_received_amount === status.total_invoice_amount) {
      return <Badge className="bg-green-500/10 text-green-700 border-green-200 text-xs">완료</Badge>
    } else if (status.total_received_amount > status.total_invoice_amount) {
      return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200 text-xs">과납</Badge>
    } else if (status.total_remaining > 0) {
      return <Badge className="bg-red-500/10 text-red-700 border-red-200 text-xs">미납</Badge>
    } else {
      return <Badge className="bg-green-500/10 text-green-700 border-green-200 text-xs">완료</Badge>
    }
  }

  const getPaymentRateColor = (rate: number) => {
    if (rate >= 100) return 'text-green-600'
    if (rate >= 70) return 'text-amber-600'
    return 'text-red-600'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>업체별 현황</CardTitle>
          <Button onClick={fetchCustomerStatuses} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
        
        {/* 필터 */}
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="업체명 검색..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(value: any) => {
            setStatusFilter(value)
            setCurrentPage(1)
          }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="complete">완료</SelectItem>
              <SelectItem value="unpaid">미납</SelectItem>
              <SelectItem value="overpaid">과납</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={pageSize.toString()} onValueChange={(value) => {
            setPageSize(Number(value))
            setCurrentPage(1)
          }}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10개</SelectItem>
              <SelectItem value="20">20개</SelectItem>
              <SelectItem value="50">50개</SelectItem>
              <SelectItem value="100">100개</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[25%] py-3 px-4">업체명</TableHead>
              <TableHead className="w-[15%] py-3 px-4 text-right">세금계산서</TableHead>
              <TableHead className="w-[15%] py-3 px-4 text-right">입금액</TableHead>
              <TableHead className="w-[15%] py-3 px-4 text-right">미수금</TableHead>
              <TableHead className="w-[15%] py-3 px-4 text-center">수금률</TableHead>
              <TableHead className="w-[15%] py-3 px-4 text-center">상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statuses.map((status) => (
              <TableRow key={status.customer_id} className="hover:bg-muted/30">
                <TableCell className="py-3 px-4 font-medium">
                  {status.company_name}
                </TableCell>
                <TableCell className="py-3 px-4 text-right">
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold">{formatKRW(status.total_invoice_amount)}</div>
                    <div className="text-xs text-muted-foreground">{status.invoice_count}건</div>
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4 text-right">
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-green-600">
                      {formatKRW(status.total_received_amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">{status.deposit_count}건 입금</div>
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4 text-right">
                  {status.total_remaining > 0 ? (
                    <div className="text-sm font-semibold text-red-600">
                      {formatKRW(status.total_remaining)}
                    </div>
                  ) : status.total_received_amount > status.total_invoice_amount ? (
                    <div className="text-sm font-semibold text-blue-600">
                      +{formatKRW(status.total_received_amount - status.total_invoice_amount)}
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-green-600">
                      {formatKRW(0)}
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-3 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`text-sm font-bold ${getPaymentRateColor(status.payment_rate)}`}>
                      {status.payment_rate.toFixed(1)}%
                    </span>
                    <Progress 
                      value={Math.min(status.payment_rate, 100)} 
                      className="w-20 h-2"
                    />
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4 text-center">
                  {getStatusBadge(status)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* 페이지네이션 */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-muted-foreground">
            총 {totalCount}개 중 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)}개 표시
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
            
            <span className="text-sm">
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
      </CardContent>
    </Card>
  )
}