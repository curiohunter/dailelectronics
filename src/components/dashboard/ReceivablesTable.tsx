"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchIcon, CircleIcon, ArrowUpDown, ArrowUp, ArrowDown, StickyNote } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CustomerReceivable {
  id: string
  companyName: string
  phone?: string | null
  invoiceAmount: number
  depositAmount: number
  balance: number
  overdueDays: number | null
  status: 'complete' | 'unpaid' | 'overpaid'
  oldestUnpaidDate: string | null
  notes?: string | null
  latestInvoiceDate?: string | null
  latestDepositDate?: string | null
  hasOtherDeposits?: boolean
}

interface ReceivablesTableProps {
  customers: CustomerReceivable[]
  loading: boolean
  onCustomerClick: (customer: CustomerReceivable) => void
}

export function ReceivablesTable({ customers, loading, onCustomerClick }: ReceivablesTableProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'complete' | 'unpaid' | '30days' | '60days' | '90days' | 'overpaid'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: 'companyName' | 'invoiceAmount' | 'depositAmount' | 'balance' | 'overdueDays' | 'latestInvoiceDate' | 'latestDepositDate'
    direction: 'asc' | 'desc'
  }>({ key: 'balance', direction: 'desc' })
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerReceivable[]>([])

  useEffect(() => {
    filterAndSortCustomers()
  }, [customers, filterStatus, searchQuery, sortConfig])

  const filterAndSortCustomers = () => {
    let filtered = [...customers]

    // Apply status filter
    if (filterStatus === 'complete') {
      filtered = filtered.filter(c => c.status === 'complete')
    } else if (filterStatus === 'unpaid') {
      filtered = filtered.filter(c => c.status === 'unpaid')
    } else if (filterStatus === '30days') {
      filtered = filtered.filter(c => c.status === 'unpaid' && c.overdueDays && c.overdueDays >= 30)
    } else if (filterStatus === '60days') {
      filtered = filtered.filter(c => c.status === 'unpaid' && c.overdueDays && c.overdueDays >= 60)
    } else if (filterStatus === '90days') {
      filtered = filtered.filter(c => c.status === 'unpaid' && c.overdueDays && c.overdueDays >= 90)
    } else if (filterStatus === 'overpaid') {
      filtered = filtered.filter(c => c.status === 'overpaid')
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.companyName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any
      
      switch (sortConfig.key) {
        case 'companyName':
          aValue = a.companyName
          bValue = b.companyName
          break
        case 'invoiceAmount':
          aValue = a.invoiceAmount
          bValue = b.invoiceAmount
          break
        case 'depositAmount':
          aValue = a.depositAmount
          bValue = b.depositAmount
          break
        case 'balance':
          aValue = Math.abs(a.balance)
          bValue = Math.abs(b.balance)
          break
        case 'overdueDays':
          aValue = a.overdueDays || 0
          bValue = b.overdueDays || 0
          break
        case 'latestInvoiceDate':
          aValue = a.latestInvoiceDate ? new Date(a.latestInvoiceDate).getTime() : 0
          bValue = b.latestInvoiceDate ? new Date(b.latestInvoiceDate).getTime() : 0
          break
        case 'latestDepositDate':
          aValue = a.latestDepositDate ? new Date(a.latestDepositDate).getTime() : 0
          bValue = b.latestDepositDate ? new Date(b.latestDepositDate).getTime() : 0
          break
      }
      
      if (sortConfig.key === 'companyName') {
        // String comparison for company names
        if (sortConfig.direction === 'asc') {
          return aValue.localeCompare(bValue, 'ko')
        } else {
          return bValue.localeCompare(aValue, 'ko')
        }
      } else {
        // Number comparison
        if (sortConfig.direction === 'asc') {
          return aValue - bValue
        } else {
          return bValue - aValue
        }
      }
    })

    setFilteredCustomers(filtered)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: 'complete' | 'unpaid' | 'overpaid') => {
    switch (status) {
      case 'complete':
        return 'text-green-600'
      case 'unpaid':
        return 'text-red-600'
      case 'overpaid':
        return 'text-blue-600'
    }
  }

  const getStatusIcon = (status: 'complete' | 'unpaid' | 'overpaid') => {
    switch (status) {
      case 'complete':
        return <CircleIcon className="h-4 w-4 fill-green-500 text-green-500" />
      case 'unpaid':
        return <CircleIcon className="h-4 w-4 fill-red-500 text-red-500" />
      case 'overpaid':
        return <CircleIcon className="h-4 w-4 fill-blue-500 text-blue-500" />
    }
  }

  const getOverdueIcon = (days: number | null) => {
    if (!days) return null
    
    if (days <= 7) return <CircleIcon className="h-3 w-3 fill-green-500 text-green-500" />
    if (days <= 30) return <CircleIcon className="h-3 w-3 fill-yellow-500 text-yellow-500" />
    if (days <= 60) return <CircleIcon className="h-3 w-3 fill-orange-500 text-orange-500" />
    if (days <= 90) return <CircleIcon className="h-3 w-3 fill-red-500 text-red-500" />
    return <CircleIcon className="h-3 w-3 fill-black text-black" />
  }

  const handleSort = (key: typeof sortConfig.key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  const getSortIcon = (key: typeof sortConfig.key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortConfig.direction === 'desc' 
      ? <ArrowDown className="h-4 w-4" />
      : <ArrowUp className="h-4 w-4" />
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}`
  }

  return (
    <>
      {/* Filter Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            전체 {customers.length}개
          </Button>
          <Button
            variant={filterStatus === 'complete' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('complete')}
            className={filterStatus === 'complete' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            🟢 수금완료 {customers.filter(c => c.status === 'complete').length}개
          </Button>
          <Button
            variant={filterStatus === 'unpaid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('unpaid')}
            className={filterStatus === 'unpaid' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            🔴 미수금 {customers.filter(c => c.status === 'unpaid').length}개
          </Button>
          <Button
            variant={filterStatus === '30days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('30days')}
            className={filterStatus === '30days' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
          >
            🟡 30일+ {customers.filter(c => c.status === 'unpaid' && c.overdueDays && c.overdueDays >= 30).length}개
          </Button>
          <Button
            variant={filterStatus === '60days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('60days')}
            className={filterStatus === '60days' ? 'bg-orange-600 hover:bg-orange-700' : ''}
          >
            🟠 60일+ {customers.filter(c => c.status === 'unpaid' && c.overdueDays && c.overdueDays >= 60).length}개
          </Button>
          <Button
            variant={filterStatus === '90days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('90days')}
            className={filterStatus === '90days' ? 'bg-red-700 hover:bg-red-800' : ''}
          >
            🔴 90일+ {customers.filter(c => c.status === 'unpaid' && c.overdueDays && c.overdueDays >= 90).length}개
          </Button>
          <Button
            variant={filterStatus === 'overpaid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('overpaid')}
            className={filterStatus === 'overpaid' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            🔵 과납 {customers.filter(c => c.status === 'overpaid').length}개
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="업체명 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {/* Removed old sort selector as we now have column header sorting */}
        </div>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            미수금 관리 현황 
            {filterStatus !== 'all' && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filteredCustomers.length}개 업체 / 전체 {customers.length}개)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[5%] text-center">상태</TableHead>
                <TableHead 
                  className="w-[12%] text-left cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('companyName')}
                >
                  <div className="flex items-center gap-1">
                    업체명
                    {getSortIcon('companyName')}
                  </div>
                </TableHead>
                <TableHead className="w-[10%] text-center">전화번호</TableHead>
                <TableHead 
                  className="w-[7%] text-center cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('latestInvoiceDate')}
                >
                  <div className="flex items-center justify-center gap-1">
                    발행일
                    {getSortIcon('latestInvoiceDate')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[10%] text-right cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('invoiceAmount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    세금계산서
                    {getSortIcon('invoiceAmount')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[7%] text-center cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('latestDepositDate')}
                >
                  <div className="flex items-center justify-center gap-1">
                    입금일
                    {getSortIcon('latestDepositDate')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[10%] text-right cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('depositAmount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    입금액
                    {getSortIcon('depositAmount')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[12%] text-right cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('balance')}
                >
                  <div className="flex items-center justify-end gap-1">
                    미수/과납금
                    {getSortIcon('balance')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[9%] text-center cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('overdueDays')}
                >
                  <div className="flex items-center justify-center gap-1">
                    경과일
                    {getSortIcon('overdueDays')}
                  </div>
                </TableHead>
                <TableHead className="w-[18%] text-left">메모</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="text-muted-foreground">데이터를 불러오는 중...</div>
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="text-muted-foreground">조건에 만는 업체가 없습니다.</div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onCustomerClick(customer)}
                  >
                    <TableCell className="w-[5%]">
                      <div className="flex justify-center items-center">
                        {getStatusIcon(customer.status)}
                      </div>
                    </TableCell>
                    <TableCell className="w-[12%]">
                      <div className="text-left font-medium truncate" title={customer.companyName}>
                        {customer.companyName}
                      </div>
                    </TableCell>
                    <TableCell className="w-[10%]">
                      <div className="text-center text-sm">
                        {customer.phone || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="w-[7%]">
                      <div className="text-center text-sm tabular-nums text-gray-600">
                        {formatDate(customer.latestInvoiceDate)}
                      </div>
                    </TableCell>
                    <TableCell className="w-[10%]">
                      <div className="text-right tabular-nums">
                        {formatCurrency(customer.invoiceAmount)}
                      </div>
                    </TableCell>
                    <TableCell className="w-[7%]">
                      <div className="text-center text-sm tabular-nums text-gray-600">
                        {formatDate(customer.latestDepositDate)}
                      </div>
                    </TableCell>
                    <TableCell className="w-[10%]">
                      <div className="text-right tabular-nums">
                        {formatCurrency(customer.depositAmount)}
                      </div>
                    </TableCell>
                    <TableCell className="w-[12%]">
                      <div className={cn("text-right font-semibold tabular-nums", getStatusColor(customer.status))}>
                        {customer.balance > 0 && '+'}
                        {formatCurrency(customer.balance)}
                      </div>
                    </TableCell>
                    <TableCell className="w-[9%]">
                      <div className="flex items-center justify-center gap-1">
                        {getOverdueIcon(customer.overdueDays)}
                        <span className="tabular-nums">{customer.overdueDays ? `${customer.overdueDays}일` : '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="w-[18%]">
                      <div className="flex items-center gap-2">
                        {customer.notes && (
                          <StickyNote className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                        )}
                        <div className="text-sm text-gray-600 truncate" title={customer.notes || ''}>
                          {customer.notes ? 
                            (customer.notes.length > 20 
                              ? customer.notes.substring(0, 20) + '...' 
                              : customer.notes
                            ) : '-'
                          }
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}