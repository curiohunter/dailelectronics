"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

interface Customer {
  id: string
  business_number: string | null
  company_name: string
  representative_name: string | null
  address: string | null
  email: string | null
  phone: string | null
  notes: string | null
  alias_names: string[] | null
  created_at: string | null
  updated_at: string | null
}

interface CustomersTableProps {
  customers: Customer[]
  searchQuery: string
  onSearchChange: (value: string) => void
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

type SortField = 'company_name' | 'representative_name' | 'phone' | null
type SortDirection = 'asc' | 'desc'

export function CustomersTable({
  customers,
  searchQuery,
  onSearchChange,
  onEdit,
  onDelete
}: CustomersTableProps) {
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // 필터링
  const filteredCustomers = customers.filter(customer => {
    const query = searchQuery.toLowerCase()
    return (
      customer.company_name.toLowerCase().includes(query) ||
      customer.representative_name?.toLowerCase().includes(query) ||
      customer.business_number?.includes(query) ||
      customer.phone?.includes(query) ||
      customer.notes?.toLowerCase().includes(query) ||
      customer.alias_names?.some(alias => alias.toLowerCase().includes(query))
    )
  })

  // 검색 시 첫 페이지로 리셋
  if (searchQuery && currentPage > 1) {
    setCurrentPage(1)
  }

  // 정렬
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (!sortField) return 0

    let aValue: string = ''
    let bValue: string = ''

    switch (sortField) {
      case 'company_name':
        aValue = a.company_name || ''
        bValue = b.company_name || ''
        break
      case 'representative_name':
        aValue = a.representative_name || ''
        bValue = b.representative_name || ''
        break
      case 'phone':
        aValue = a.phone || ''
        bValue = b.phone || ''
        break
    }

    // 한국어 정렬을 위해 localeCompare 사용
    const compareResult = aValue.localeCompare(bValue, 'ko')
    return sortDirection === 'asc' ? compareResult : -compareResult
  })

  // 페이지네이션
  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCustomers = sortedCustomers.slice(startIndex, endIndex)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="회사명, 대표자명, 전화번호, 메모 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 w-full max-w-sm"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[15%]">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 lg:px-3 -ml-2"
                onClick={() => handleSort('company_name')}
              >
                회사명
                {getSortIcon('company_name')}
              </Button>
            </TableHead>
            <TableHead className="w-[12%]">사업자번호</TableHead>
            <TableHead className="w-[10%]">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 lg:px-3 -ml-2"
                onClick={() => handleSort('representative_name')}
              >
                대표자
                {getSortIcon('representative_name')}
              </Button>
            </TableHead>
            <TableHead className="w-[12%]">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 lg:px-3 -ml-2"
                onClick={() => handleSort('phone')}
              >
                전화번호
                {getSortIcon('phone')}
              </Button>
            </TableHead>
            <TableHead className="w-[15%]">메모</TableHead>
            <TableHead className="w-[12%]">별칭</TableHead>
            <TableHead className="w-[15%]">주소</TableHead>
            <TableHead className="w-[9%] text-center">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedCustomers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                {sortedCustomers.length === 0
                  ? (searchQuery ? '검색 결과가 없습니다.' : '고객사가 없습니다.')
                  : '현재 페이지에 표시할 항목이 없습니다.'}
              </TableCell>
            </TableRow>
          ) : (
            paginatedCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.company_name}</TableCell>
                <TableCell>{customer.business_number || '-'}</TableCell>
                <TableCell>{customer.representative_name || '-'}</TableCell>
                <TableCell>{customer.phone || '-'}</TableCell>
                <TableCell className="max-w-xs">
                  {customer.notes ? (
                    <div className="truncate" title={customer.notes}>
                      {customer.notes.length > 30 
                        ? `${customer.notes.substring(0, 30)}...` 
                        : customer.notes}
                    </div>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  {customer.alias_names && customer.alias_names.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {customer.alias_names.slice(0, 2).map((alias, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {alias}
                        </Badge>
                      ))}
                      {customer.alias_names.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{customer.alias_names.length - 2}
                        </Badge>
                      )}
                    </div>
                  ) : '-'}
                </TableCell>
                <TableCell className="max-w-xs truncate">{customer.address || '-'}</TableCell>
                <TableCell>
                  <div className="flex justify-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(customer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(customer)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
            총 {sortedCustomers.length}개 중 {startIndex + 1}-{Math.min(endIndex, sortedCustomers.length)}
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
    </div>
  )
}