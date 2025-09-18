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
  const itemsPerPage = 20

  // 고객사 정렬 (가나다순)
  const sortedCustomers = [...customers].sort((a, b) =>
    a.company_name.localeCompare(b.company_name, 'ko')
  )

  // 고객사 검색 필터링 (CustomersTable과 동일한 방식)
  const filteredCustomers = sortedCustomers.filter(customer => {
    if (!customerSearchQuery) return true
    const query = customerSearchQuery.toLowerCase()
    return customer.company_name.toLowerCase().includes(query)
  })

  // 검색 및 연결 상태 필터링
  const filteredDeposits = deposits.filter(deposit => {
    // 검색 필터
    const query = searchQuery.toLowerCase()
    const matchesSearch = !searchQuery || (
      deposit.deposit_name?.toLowerCase().includes(query) ||
      deposit.branch_name?.toLowerCase().includes(query) ||
      deposit.relatedCustomer?.company_name?.toLowerCase().includes(query)
    )

    // 연결 상태 필터
    const matchesConnection = connectionFilter === 'all' ||
      (connectionFilter === 'customer' && deposit.hasRelation) ||
      (connectionFilter === 'internal' && deposit.classification?.classification_type === 'internal') ||
      (connectionFilter === 'external' && deposit.classification?.classification_type === 'external') ||
      (connectionFilter === 'unconnected' && !deposit.hasRelation && !deposit.classification)

    return matchesSearch && matchesConnection
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
        <div className="flex items-center justify-between">
          <CardTitle>입금내역 목록</CardTitle>
          <div className="flex gap-2">
            {/* 연결 상태 필터 */}
            <Select value={connectionFilter} onValueChange={(value) => {
              setConnectionFilter(value as ConnectionFilter)
              setCurrentPage(1) // 필터 변경 시 첫 페이지로
            }}>
              <SelectTrigger className="w-36">
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

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="검색..."
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value)
                  setCurrentPage(1) // 검색 시 첫 페이지로
                }}
                className="pl-10 w-64"
              />
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
                                        ? customers.find((customer) => customer.id === selectedCustomer)?.company_name
                                        : "고객사를 검색하세요..."}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[380px] p-0" align="start">
                                    <Command>
                                      <CommandInput
                                        placeholder="고객사명 검색..."
                                        value={customerSearchQuery}
                                        onValueChange={setCustomerSearchQuery}
                                      />
                                      <CommandList className="max-h-[200px]">
                                        <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                                        <CommandGroup className="overflow-y-auto">
                                          {filteredCustomers.map((customer) => (
                                            <CommandItem
                                              key={customer.id}
                                              value={customer.company_name}
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
                                              {customer.company_name}
                                            </CommandItem>
                                          ))}
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
        depositName={selectedDepositForClassification?.deposit_name}
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