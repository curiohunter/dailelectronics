"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TaxInvoiceModal } from "./TaxInvoiceModal"
import {
  Search, RefreshCw, Link, Loader2, Plus, Edit, Trash2,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight
} from "lucide-react"

interface Customer {
  id: string
  company_name: string
  business_number?: string | null
  representative_name?: string | null
  address?: string | null
  email?: string | null
  phone?: string | null
  notes?: string | null
  alias_names?: string[] | null
  created_at?: string | null
  updated_at?: string | null
  [key: string]: any
}

interface TaxInvoice {
  id: string
  approval_number: string | null
  issue_date: string
  buyer_company_name: string | null
  total_amount: number
  supply_amount: number
  tax_amount: number
  item_name: string | null
  created_at: string | null
  hasRelation?: boolean
  relatedCustomer?: Customer | null
  [key: string]: any
}

interface TaxInvoicesTabProps {
  invoices: TaxInvoice[]
  customers: Customer[]
  loading: boolean
  searchQuery: string
  onSearchChange: (value: string) => void
  onRefresh: () => void
  onConnectInvoice: (invoiceId: string, customerId: string) => void
  onAdd?: () => void
  onEdit?: (invoice: TaxInvoice) => void
  onDelete?: (invoice: TaxInvoice) => void
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR')
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0
  }).format(amount)
}

const formatAmount = (amount: number) => {
  return amount.toLocaleString('ko-KR')
}

type SortField = 'issue_date' | 'buyer_company_name' | 'total_amount' | 'item_name' | null
type SortDirection = 'asc' | 'desc'
type ConnectionFilter = 'all' | 'connected' | 'disconnected'

export function TaxInvoicesTab({
  invoices,
  customers,
  loading,
  searchQuery,
  onSearchChange,
  onRefresh,
  onConnectInvoice,
  onAdd,
  onEdit,
  onDelete
}: TaxInvoicesTabProps) {
  // 상태 관리
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [connectionFilter, setConnectionFilter] = useState<ConnectionFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const itemsPerPage = 20

  // 검색 및 연결 상태 필터링
  const filteredInvoices = invoices.filter(invoice => {
    // 검색 필터
    const query = searchQuery.toLowerCase()
    const matchesSearch = !searchQuery || (
      invoice.buyer_company_name?.toLowerCase().includes(query) ||
      invoice.item_name?.toLowerCase().includes(query) ||
      invoice.approval_number?.toLowerCase().includes(query) ||
      invoice.relatedCustomer?.company_name?.toLowerCase().includes(query)
    )

    // 날짜 범위 필터
    if (invoice.issue_date) {
      const issueDate = new Date(invoice.issue_date)
      const matchesDateRange =
        (!startDate || issueDate >= new Date(startDate)) &&
        (!endDate || issueDate <= new Date(endDate))
      if (!matchesDateRange) return false
    }

    // 연결 상태 필터
    const matchesConnection = connectionFilter === 'all' ||
      (connectionFilter === 'connected' && invoice.hasRelation) ||
      (connectionFilter === 'disconnected' && !invoice.hasRelation)

    return matchesSearch && matchesConnection
  })

  // 총 금액 계산 (필터링된 결과 기준)
  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0)

  // 정렬
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (!sortField) return 0

    let aValue: any = ''
    let bValue: any = ''

    switch (sortField) {
      case 'issue_date':
        aValue = new Date(a.issue_date).getTime()
        bValue = new Date(b.issue_date).getTime()
        break
      case 'buyer_company_name':
        aValue = a.buyer_company_name || ''
        bValue = b.buyer_company_name || ''
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue, 'ko')
          : bValue.localeCompare(aValue, 'ko')
      case 'total_amount':
        aValue = a.total_amount || 0
        bValue = b.total_amount || 0
        break
      case 'item_name':
        aValue = a.item_name || ''
        bValue = b.item_name || ''
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue, 'ko')
          : bValue.localeCompare(aValue, 'ko')
    }

    if (sortField === 'issue_date' || sortField === 'total_amount') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  // 페이지네이션
  const totalPages = Math.ceil(sortedInvoices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedInvoices = sortedInvoices.slice(startIndex, endIndex)

  // 정렬 핸들러
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // 정렬 아이콘
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <CardTitle>세금계산서 목록</CardTitle>

          {/* 필터 및 총 금액 영역 */}
          <div className="flex items-center justify-between gap-4">
            {/* 좌측: 필터 영역 */}
            <div className="flex items-center gap-2">
              {/* 시작일 */}
              <div className="flex items-center gap-2">
                <Label htmlFor="start-date" className="text-sm whitespace-nowrap">시작일</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-40"
                />
              </div>

              {/* 종료일 */}
              <div className="flex items-center gap-2">
                <Label htmlFor="end-date" className="text-sm whitespace-nowrap">종료일</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-40"
                />
              </div>

              {/* 연결 상태 필터 */}
              <Select value={connectionFilter} onValueChange={(value) => {
                setConnectionFilter(value as ConnectionFilter)
                setCurrentPage(1)
              }}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="connected">연결됨</SelectItem>
                  <SelectItem value="disconnected">미연결</SelectItem>
                </SelectContent>
              </Select>

              {/* 검색 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="검색..."
                  value={searchQuery}
                  onChange={(e) => {
                    onSearchChange(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-10 w-48"
                />
              </div>
            </div>

            {/* 우측: 총 금액 + 액션 버튼 */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 rounded-md border border-rose-200 dark:border-rose-800">
                <span className="text-xl font-bold text-rose-700 dark:text-rose-300">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              <Button onClick={onRefresh} size="icon" variant="outline">
                <RefreshCw className="h-4 w-4" />
              </Button>
              {onAdd && (
                <Button onClick={onAdd}>
                  <Plus className="mr-2 h-4 w-4" />
                  추가
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 lg:px-3 -ml-2"
                  onClick={() => handleSort('issue_date')}
                >
                  발행일
                  {getSortIcon('issue_date')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 lg:px-3 -ml-2"
                  onClick={() => handleSort('buyer_company_name')}
                >
                  공급받는자
                  {getSortIcon('buyer_company_name')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 lg:px-3 -ml-2"
                  onClick={() => handleSort('item_name')}
                >
                  품목
                  {getSortIcon('item_name')}
                </Button>
              </TableHead>
              <TableHead>공급가액</TableHead>
              <TableHead>세액</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 lg:px-3 -ml-2"
                  onClick={() => handleSort('total_amount')}
                >
                  합계
                  {getSortIcon('total_amount')}
                </Button>
              </TableHead>
              <TableHead>연결업체</TableHead>
              <TableHead className="text-center">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : paginatedInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {sortedInvoices.length === 0
                    ? "세금계산서가 없습니다."
                    : "현재 페이지에 표시할 항목이 없습니다."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                  <TableCell>{invoice.buyer_company_name || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">{invoice.item_name || '-'}</TableCell>
                  <TableCell>{formatCurrency(invoice.supply_amount)}</TableCell>
                  <TableCell>{formatCurrency(invoice.tax_amount)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(invoice.total_amount)}</TableCell>
                  <TableCell>
                    {invoice.hasRelation ? (
                      <Badge variant="default">
                        {invoice.relatedCustomer?.company_name || '연결됨'} ✅
                      </Badge>
                    ) : (
                      <Badge variant="destructive">미연결 ❌</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      {!invoice.hasRelation && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <Link className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>고객사 연결</DialogTitle>
                              <DialogDescription>
                                이 세금계산서를 연결할 고객사를 선택하세요.
                              </DialogDescription>
                            </DialogHeader>
                            <Select
                              onValueChange={(value) => onConnectInvoice(invoice.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="고객사 선택" />
                              </SelectTrigger>
                              <SelectContent>
                                {customers.map(customer => (
                                  <SelectItem key={customer.id} value={customer.id}>
                                    {customer.company_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </DialogContent>
                        </Dialog>
                      )}
                      {onEdit && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onEdit(invoice)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onDelete(invoice)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* 페이지네이션 컨트롤 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-muted-foreground">
              총 {sortedInvoices.length}개 중 {startIndex + 1}-{Math.min(endIndex, sortedInvoices.length)}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                이전
              </Button>

              {/* 첫 페이지 */}
              <Button
                variant={currentPage === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(1)}
                className="min-w-[40px]"
              >
                1
              </Button>

              {/* 생략 부호 (앞) */}
              {currentPage > 3 && (
                <span className="px-2 text-muted-foreground">...</span>
              )}

              {/* 중간 페이지들 */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  if (page === 1 || page === totalPages) return false
                  if (page >= currentPage - 1 && page <= currentPage + 1) return true
                  return false
                })
                .map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="min-w-[40px]"
                  >
                    {page}
                  </Button>
                ))}

              {/* 생략 부호 (뒤) */}
              {currentPage < totalPages - 2 && (
                <span className="px-2 text-muted-foreground">...</span>
              )}

              {/* 마지막 페이지 */}
              {totalPages > 1 && (
                <Button
                  variant={currentPage === totalPages ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  className="min-w-[40px]"
                >
                  {totalPages}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                다음
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}