"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pencil,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react"

interface BankDeposit {
  id: string
  transaction_date: string
  transaction_time: string | null
  deposit_name: string | null
  deposit_amount: number
  branch_name: string | null
  created_at: string | null
  [key: string]: any
}

interface OtherDeposit {
  id: string
  bank_deposit_id: string
  classification_type: 'internal' | 'external'
  classification_detail: string | null
  created_at: string
  updated_at: string
  deposit?: BankDeposit
}

interface OtherDepositsTabProps {
  otherDeposits: OtherDeposit[]
  onAdd: () => void
  onEdit: (deposit: OtherDeposit) => void
  onDelete: (deposit: OtherDeposit) => void
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR')
}

const formatTime = (timeString: string | null) => {
  if (!timeString) return ''
  return timeString.substring(0, 5)
}

const formatAmount = (amount: number) => {
  return amount.toLocaleString('ko-KR')
}

type SortField = 'transaction_date' | 'deposit_name' | null
type SortDirection = 'asc' | 'desc'

export function OtherDepositsTab({
  otherDeposits,
  onAdd,
  onEdit,
  onDelete
}: OtherDepositsTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<'all' | 'internal' | 'external'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const itemsPerPage = 20

  // 필터링
  const filteredDeposits = otherDeposits.filter(deposit => {
    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesDepositName = deposit.deposit?.deposit_name?.toLowerCase().includes(query)
      const matchesDetail = deposit.classification_detail?.toLowerCase().includes(query)
      if (!matchesDepositName && !matchesDetail) return false
    }

    // 타입 필터
    if (typeFilter !== 'all' && deposit.classification_type !== typeFilter) {
      return false
    }

    return true
  })

  // 정렬
  const sortedDeposits = [...filteredDeposits].sort((a, b) => {
    if (!sortField) return 0

    let aValue: any = ''
    let bValue: any = ''

    if (sortField === 'transaction_date') {
      aValue = a.deposit?.transaction_date || ''
      bValue = b.deposit?.transaction_date || ''
    } else if (sortField === 'deposit_name') {
      aValue = a.deposit?.deposit_name || ''
      bValue = b.deposit?.deposit_name || ''
    }

    // 날짜 정렬
    if (sortField === 'transaction_date') {
      const aDate = new Date(aValue).getTime()
      const bDate = new Date(bValue).getTime()
      return sortDirection === 'asc' ? aDate - bDate : bDate - aDate
    }

    // 문자열 정렬 (한국어 정렬)
    if (sortField === 'deposit_name') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue, 'ko')
        : bValue.localeCompare(aValue, 'ko')
    }

    return 0
  })

  // 페이지네이션 계산
  const totalPages = Math.ceil(sortedDeposits.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedDeposits = sortedDeposits.slice(startIndex, endIndex)

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  // 정렬 핸들러
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setCurrentPage(1) // 정렬 시 첫 페이지로 이동
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
        <div className="flex justify-between items-center">
          <CardTitle>기타 입금 관리</CardTitle>
          <Button onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            기타 입금 추가
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* 필터 섹션 */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <Label htmlFor="search">검색</Label>
            <Input
              id="search"
              placeholder="입금명, 상세 내용 검색..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>

          <div>
            <Label htmlFor="type-filter">분류 필터</Label>
            <Select value={typeFilter} onValueChange={(value: any) => {
              setTypeFilter(value)
              setCurrentPage(1)
            }}>
              <SelectTrigger id="type-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="internal">내부 경영</SelectItem>
                <SelectItem value="external">외부 기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-muted-foreground">
              총 {filteredDeposits.length}개 기타 입금
            </div>
          </div>
        </div>

        {/* 테이블 */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[10%]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-full justify-center font-normal hover:bg-transparent"
                  onClick={() => handleSort('transaction_date')}
                >
                  입금일자
                  {getSortIcon('transaction_date')}
                </Button>
              </TableHead>
              <TableHead className="w-[8%]">
                <div className="text-center">시간</div>
              </TableHead>
              <TableHead className="w-[15%]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-full justify-start font-normal hover:bg-transparent"
                  onClick={() => handleSort('deposit_name')}
                >
                  입금명
                  {getSortIcon('deposit_name')}
                </Button>
              </TableHead>
              <TableHead className="w-[12%]">
                <div className="text-right">입금액</div>
              </TableHead>
              <TableHead className="w-[12%]">
                <div className="text-center">분류</div>
              </TableHead>
              <TableHead className="w-[28%]">
                <div className="text-left">상세 내용</div>
              </TableHead>
              <TableHead className="w-[15%]">
                <div className="text-center">작업</div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDeposits.length > 0 ? (
              paginatedDeposits.map((deposit) => (
                <TableRow key={deposit.id}>
                  <TableCell className="w-[10%]">
                    <div className="text-center text-sm">
                      {deposit.deposit ? formatDate(deposit.deposit.transaction_date) : '-'}
                    </div>
                  </TableCell>
                  <TableCell className="w-[8%]">
                    <div className="text-center text-sm text-muted-foreground">
                      {deposit.deposit ? formatTime(deposit.deposit.transaction_time) : '-'}
                    </div>
                  </TableCell>
                  <TableCell className="w-[15%]">
                    <div className="text-left font-medium">
                      {deposit.deposit?.deposit_name || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="w-[12%]">
                    <div className="text-right tabular-nums">
                      {deposit.deposit ? `${formatAmount(deposit.deposit.deposit_amount)}원` : '-'}
                    </div>
                  </TableCell>
                  <TableCell className="w-[12%]">
                    <div className="text-center">
                      {deposit.classification_type === 'internal' ? (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                          내부 경영
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                          외부 기타
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="w-[28%]">
                    <div className="text-left text-sm">
                      {deposit.classification_detail || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="w-[15%]">
                    <div className="flex justify-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onEdit(deposit)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onDelete(deposit)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {searchQuery || typeFilter !== 'all'
                    ? "검색 결과가 없습니다."
                    : "기타 입금 내역이 없습니다."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-muted-foreground">
              총 {filteredDeposits.length}개 중 {startIndex + 1}-{Math.min(endIndex, filteredDeposits.length)}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
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
                onClick={handleNextPage}
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