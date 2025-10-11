"use client"

import { useState, useCallback } from "react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { BankDepositModal } from "./BankDepositModal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DepositClassificationModal } from "./DepositClassificationModal"
import {
  Search, RefreshCw, Link, Loader2, Plus, Edit, Trash2, Check, ChevronsUpDown,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

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

interface DepositClassification {
  classification_type: 'internal' | 'external'
  classification_detail: string | null
}

interface BankDeposit {
  id: string
  transaction_date: string
  transaction_time: string | null
  deposit_name: string | null
  deposit_amount: number
  branch_name: string | null
  created_at: string | null
  hasRelation?: boolean
  relatedCustomer?: Customer | null
  classification?: DepositClassification | null
  [key: string]: any
}

interface BankDepositsTabProps {
  deposits: BankDeposit[]
  customers: Customer[]
  loading: boolean
  searchQuery: string
  onSearchChange: (value: string) => void
  onRefresh: () => void
  onConnectDeposit: (depositId: string, customerId: string) => void
  onClassifyDeposit: (depositId: string, type: 'internal' | 'external', detail: string) => void
  onAdd?: () => void
  onEdit?: (deposit: BankDeposit) => void
  onDelete?: (deposit: BankDeposit) => void
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR')
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR', { 
    style: 'currency', 
    currency: 'KRW' 
  }).format(amount)
}

type SortField = 'transaction_date' | 'deposit_name' | 'deposit_amount' | 'branch_name' | null
type SortDirection = 'asc' | 'desc'
type ConnectionFilter = 'all' | 'customer' | 'internal' | 'external' | 'unconnected'

export function BankDepositsTab({
  deposits,
  customers,
  loading,
  searchQuery,
  onSearchChange,
  onRefresh,
  onConnectDeposit,
  onClassifyDeposit,
  onAdd,
  onEdit,
  onDelete
}: BankDepositsTabProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [openDialogId, setOpenDialogId] = useState<string | null>(null)
  const [openPopover, setOpenPopover] = useState(false)
  const [customerSearchQuery, setCustomerSearchQuery] = useState("")

  // Classification Modal 상태
  const [classificationModalOpen, setClassificationModalOpen] = useState(false)
  const [classificationModalType, setClassificationModalType] = useState<'internal' | 'external'>('internal')
  const [selectedDepositForClassification, setSelectedDepositForClassification] = useState<BankDeposit | null>(null)

  // 새로운 상태들
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [connectionFilter, setConnectionFilter] = useState<ConnectionFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const itemsPerPage = 20

  // 고객사 정렬 (가나다순)
  const sortedCustomers = [...customers].sort((a, b) =>
    a.company_name.localeCompare(b.company_name, 'ko')
  )

  // 고객사 검색 필터링 (회사명 + 대표자명 + 별칭)
  const filteredCustomers = sortedCustomers.filter(customer => {
    if (!customerSearchQuery) return true
    const query = customerSearchQuery.toLowerCase().trim()
    const queryWithoutSpaces = query.replace(/\s+/g, '') // 공백 제거

    // 1. 회사명 검색
    if (customer.company_name.toLowerCase().includes(query)) return true

    // 2. 대표자명 검색 (공백 포함/제거 둘 다 지원)
    if (customer.representative_name) {
      const repName = customer.representative_name.toLowerCase()
      const repNameWithoutSpaces = repName.replace(/\s+/g, '')
      if (repName.includes(query) || repNameWithoutSpaces.includes(queryWithoutSpaces)) {
        return true
      }
    }

    // 3. 별칭 검색 (배열, 공백 포함/제거 둘 다 지원)
    if (customer.alias_names?.some(alias => {
      const aliasLower = alias.toLowerCase()
      const aliasWithoutSpaces = aliasLower.replace(/\s+/g, '')
      return aliasLower.includes(query) || aliasWithoutSpaces.includes(queryWithoutSpaces)
    })) return true

    return false
  })

  // 검색, 날짜, 연결 상태 필터링
  const filteredDeposits = deposits.filter(deposit => {
    // 검색 필터
    const query = searchQuery.toLowerCase()
    const matchesSearch = !searchQuery || (
      deposit.deposit_name?.toLowerCase().includes(query) ||
      deposit.branch_name?.toLowerCase().includes(query) ||
      deposit.relatedCustomer?.company_name?.toLowerCase().includes(query)
    )

    // 날짜 범위 필터
    const depositDate = new Date(deposit.transaction_date)
    const matchesDateRange =
      (!startDate || depositDate >= new Date(startDate)) &&
      (!endDate || depositDate <= new Date(endDate))

    // 연결 상태 필터
    const matchesConnection = connectionFilter === 'all' ||
      (connectionFilter === 'customer' && deposit.hasRelation) ||
      (connectionFilter === 'internal' && deposit.classification?.classification_type === 'internal') ||
      (connectionFilter === 'external' && deposit.classification?.classification_type === 'external') ||
      (connectionFilter === 'unconnected' && !deposit.hasRelation && !deposit.classification)

    return matchesSearch && matchesDateRange && matchesConnection
  })

  // 정렬
  const sortedDeposits = [...filteredDeposits].sort((a, b) => {
    if (!sortField) return 0

    let aValue: any = ''
    let bValue: any = ''

    switch (sortField) {
      case 'transaction_date':
        aValue = new Date(a.transaction_date).getTime()
        bValue = new Date(b.transaction_date).getTime()
        break
      case 'deposit_name':
        aValue = a.deposit_name || ''
        bValue = b.deposit_name || ''
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue, 'ko')
          : bValue.localeCompare(aValue, 'ko')
      case 'deposit_amount':
        aValue = a.deposit_amount || 0
        bValue = b.deposit_amount || 0
        break
      case 'branch_name':
        aValue = a.branch_name || ''
        bValue = b.branch_name || ''
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue, 'ko')
          : bValue.localeCompare(aValue, 'ko')
    }

    if (sortField === 'transaction_date' || sortField === 'deposit_amount') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  // 총 금액 계산 (필터링된 결과 기준)
  const totalAmount = filteredDeposits.reduce((sum, deposit) => sum + deposit.deposit_amount, 0)

  // 페이지네이션
  const totalPages = Math.ceil(sortedDeposits.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedDeposits = sortedDeposits.slice(startIndex, endIndex)

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

  // 부분 업데이트를 위한 핸들러 (페이지 새로고침 없이)
  const handleCustomerSelect = useCallback((depositId: string, customerId: string) => {
    // 현재 페이지와 스크롤 위치 저장
    const scrollPosition = window.scrollY

    onConnectDeposit(depositId, customerId)
    setOpenDialogId(null)
    setSelectedCustomer("")
    setCustomerSearchQuery("")
    setOpenPopover(false)

    // 스크롤 위치 복원 (비동기 처리 후)
    setTimeout(() => {
      window.scrollTo(0, scrollPosition)
    }, 100)
  }, [onConnectDeposit])

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <CardTitle>입금내역 목록</CardTitle>

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
                  <SelectItem value="customer">고객사</SelectItem>
                  <SelectItem value="internal">내부 경영</SelectItem>
                  <SelectItem value="external">외부 기타</SelectItem>
                  <SelectItem value="unconnected">미분류</SelectItem>
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
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
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
                  onClick={() => handleSort('transaction_date')}
                >
                  거래일
                  {getSortIcon('transaction_date')}
                </Button>
              </TableHead>
              <TableHead>시간</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 lg:px-3 -ml-2"
                  onClick={() => handleSort('deposit_name')}
                >
                  입금자명
                  {getSortIcon('deposit_name')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 lg:px-3 -ml-2"
                  onClick={() => handleSort('deposit_amount')}
                >
                  입금액
                  {getSortIcon('deposit_amount')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 lg:px-3 -ml-2"
                  onClick={() => handleSort('branch_name')}
                >
                  지점
                  {getSortIcon('branch_name')}
                </Button>
              </TableHead>
              <TableHead>연결업체</TableHead>
              <TableHead className="text-center">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : paginatedDeposits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {sortedDeposits.length === 0
                    ? "입금내역이 없습니다."
                    : "현재 페이지에 표시할 항목이 없습니다."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedDeposits.map((deposit) => (
                <TableRow key={deposit.id}>
                  <TableCell>{formatDate(deposit.transaction_date)}</TableCell>
                  <TableCell>{deposit.transaction_time || '-'}</TableCell>
                  <TableCell>{deposit.deposit_name || '-'}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(deposit.deposit_amount)}</TableCell>
                  <TableCell>{deposit.branch_name || '-'}</TableCell>
                  <TableCell>
                    {deposit.hasRelation ? (
                      <Badge variant="default">
                        {deposit.relatedCustomer?.company_name || '연결됨'} ✅
                      </Badge>
                    ) : deposit.classification ? (
                      deposit.classification.classification_type === 'internal' ? (
                        <Badge variant="secondary">내부 경영 💼</Badge>
                      ) : (
                        <Badge variant="outline">외부 기타 📝</Badge>
                      )
                    ) : (
                      <Badge variant="destructive">미분류 ❌</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      {!deposit.hasRelation && !deposit.classification && (
                        <>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <Link className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => setOpenDialogId(deposit.id)}
                              >
                                🏢 고객사 연결
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedDepositForClassification(deposit)
                                  setClassificationModalType('internal')
                                  setClassificationModalOpen(true)
                                }}
                              >
                                💼 내부 경영으로 분류
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedDepositForClassification(deposit)
                                  setClassificationModalType('external')
                                  setClassificationModalOpen(true)
                                }}
                              >
                                📝 외부 기타로 분류
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <Dialog
                            open={openDialogId === deposit.id}
                            onOpenChange={(open) => {
                              setOpenDialogId(open ? deposit.id : null)
                              if (!open) {
                                setSelectedCustomer("")
                                setCustomerSearchQuery("")
                                setOpenPopover(false)
                              }
                            }}
                          >
                            <DialogTrigger />
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>고객사 연결</DialogTitle>
                              <DialogDescription>
                                "{deposit.deposit_name}" 입금내역을 연결할 고객사를 선택하세요.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <Label>입금 정보</Label>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <div>입금일: {formatDate(deposit.transaction_date)}</div>
                                  <div>입금액: {formatCurrency(deposit.deposit_amount)}</div>
                                  <div>입금자: {deposit.deposit_name}</div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`customer-search-${deposit.id}`}>
                                  고객사 검색
                                </Label>
                                <Popover open={openPopover} onOpenChange={setOpenPopover} modal={true}>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={openPopover}
                                      className="w-full justify-between"
                                    >
                                      {selectedCustomer
                                        ? (() => {
                                            const customer = customers.find((c) => c.id === selectedCustomer)
                                            if (!customer) return "고객사를 검색하세요..."
                                            return customer.representative_name
                                              ? `${customer.company_name} (${customer.representative_name})`
                                              : customer.company_name
                                          })()
                                        : "고객사를 검색하세요..."}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[380px] p-0" align="start">
                                    <Command>
                                      <CommandInput
                                        placeholder="고객사명, 대표자명 또는 별칭으로 검색..."
                                        value={customerSearchQuery}
                                        onValueChange={setCustomerSearchQuery}
                                      />
                                      <CommandList className="max-h-[200px]">
                                        <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                                        <CommandGroup className="overflow-y-auto">
                                          {filteredCustomers.map((customer) => {
                                            // 검색을 위한 통합 문자열 생성 (회사명 + 대표자명 + 별칭)
                                            const searchableText = [
                                              customer.company_name,
                                              customer.representative_name,
                                              ...(customer.alias_names || [])
                                            ].filter(Boolean).join(' ')

                                            return (
                                              <CommandItem
                                                key={customer.id}
                                                value={searchableText}
                                                keywords={[customer.company_name, customer.representative_name, ...(customer.alias_names || [])].filter((k): k is string => Boolean(k))}
                                                onSelect={() => {
                                                  setSelectedCustomer(customer.id)
                                                  setOpenPopover(false)
                                                  handleCustomerSelect(deposit.id, customer.id)
                                                }}
                                                className="cursor-pointer"
                                                onMouseDown={(e) => {
                                                  e.preventDefault()
                                                  e.stopPropagation()
                                                }}
                                                onClick={() => {
                                                  setSelectedCustomer(customer.id)
                                                  setOpenPopover(false)
                                                  handleCustomerSelect(deposit.id, customer.id)
                                                }}
                                              >
                                                <Check
                                                  className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedCustomer === customer.id ? "opacity-100" : "opacity-0"
                                                  )}
                                                />
                                                {customer.representative_name
                                                  ? `${customer.company_name} (${customer.representative_name})`
                                                  : customer.company_name}
                                              </CommandItem>
                                            )
                                          })}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        </>
                      )}
                      {onEdit && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onEdit(deposit)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onDelete(deposit)}
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

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              총 {sortedDeposits.length}개 중 {startIndex + 1}-
              {Math.min(endIndex, sortedDeposits.length)}개 표시
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                다음
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Classification Modal */}
      <DepositClassificationModal
        open={classificationModalOpen}
        onOpenChange={setClassificationModalOpen}
        type={classificationModalType}
        depositName={selectedDepositForClassification?.deposit_name || null}
        onSave={(classification) => {
          if (selectedDepositForClassification) {
            onClassifyDeposit(
              selectedDepositForClassification.id,
              classification.type,
              classification.detail
            )
          }
          setClassificationModalOpen(false)
          setSelectedDepositForClassification(null)
        }}
      />
    </Card>
  )
}