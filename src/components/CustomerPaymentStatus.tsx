'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatKRW, formatDate } from '@/lib/utils'
import { ChevronDown, ChevronRight, Calculator } from 'lucide-react'

interface TaxInvoice {
  id: string
  approval_number: string
  creation_date: string
  total_amount: number
  remaining_amount: number
  matched_amount: number
  is_matched: boolean
}

interface BankDeposit {
  id: string
  transaction_date: string
  deposit_name: string
  deposit_amount: number
  remaining_amount: number
  is_matched: boolean
  is_partially_matched: boolean
}

interface CustomerStatus {
  customer_id: string
  company_name: string
  total_invoice_amount: number
  total_received_amount: number
  total_remaining: number
  invoices: TaxInvoice[]
  deposits: BankDeposit[]
}

export default function CustomerPaymentStatus({ customerId }: { customerId: string }) {
  const supabase = createClient()
  const [status, setStatus] = useState<CustomerStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [selectedDeposits, setSelectedDeposits] = useState<string[]>([])
  const [matching, setMatching] = useState(false)

  useEffect(() => {
    fetchCustomerStatus()
  }, [customerId])

  const fetchCustomerStatus = async () => {
    try {
      // 고객 정보 조회
      interface Customer {
        company_name: string
        alias_names: string[] | null
      }
      
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single()
      
      const customer = customerData as Customer | null

      // 미완납 세금계산서 조회
      interface Invoice {
        id: string
        approval_number: string
        creation_date: string
        total_amount: number
        matched_amount: number
        remaining_amount: number
        is_matched: boolean
        [key: string]: any
      }
      
      const { data: invoicesData } = await supabase
        .from('tax_invoices')
        .select('*')
        .eq('customer_id', customerId)
        .gt('remaining_amount', 0)
        .order('creation_date', { ascending: true })
      
      const invoices = invoicesData as Invoice[] | null

      // 관련 미사용 입금 조회
      const aliases = customer?.alias_names || []
      const names = [customer?.company_name, ...aliases].filter(Boolean)
      
      interface Deposit {
        id: string
        transaction_date: string
        deposit_name: string
        deposit_amount: number
        remaining_amount: number
        is_matched: boolean
        is_partially_matched: boolean
        [key: string]: any
      }
      
      const { data: depositsData } = await supabase
        .from('bank_deposits')
        .select('*')
        .gt('remaining_amount', 0)
        .order('transaction_date', { ascending: true })
      
      const deposits = depositsData as Deposit[] | null

      // 관련 입금만 필터링
      const relatedDeposits = deposits?.filter(deposit => {
        const depositName = deposit.deposit_name.toLowerCase()
        return names.some(name => {
          if (!name) return false
          const nameClean = name.toLowerCase()
          return depositName.includes(nameClean) || nameClean.includes(depositName)
        })
      }) || []

      // 통계 계산
      const totalInvoiceAmount = invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0
      const totalMatched = invoices?.reduce((sum, inv) => sum + inv.matched_amount, 0) || 0
      const totalRemaining = invoices?.reduce((sum, inv) => sum + inv.remaining_amount, 0) || 0
      const availableDeposit = relatedDeposits.reduce((sum, dep) => sum + dep.remaining_amount, 0)

      setStatus({
        customer_id: customerId,
        company_name: customer?.company_name || '',
        total_invoice_amount: totalInvoiceAmount,
        total_received_amount: totalMatched,
        total_remaining: totalRemaining,
        invoices: invoices || [],
        deposits: relatedDeposits
      })
    } catch (error) {
      console.error('Error fetching customer status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSequentialMatch = async () => {
    if (matching) {
      console.log('이미 매칭 진행 중')
      return
    }
    
    if (selectedInvoices.length === 0 || selectedDeposits.length === 0) {
      alert('세금계산서와 입금을 선택해주세요.')
      return
    }

    setMatching(true)
    try {
      const response = await fetch('/api/matching/sequential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          invoiceIds: selectedInvoices,
          depositIds: selectedDeposits
        })
      })

      const result = await response.json()
      if (result.success) {
        alert(`매칭 완료: ${result.data.summary.total_matched}건`)
        setSelectedInvoices([])
        setSelectedDeposits([])
        fetchCustomerStatus()
      } else {
        alert(result.error || '매칭 실패')
      }
    } catch (error) {
      console.error('Error matching:', error)
      alert('매칭 중 오류가 발생했습니다.')
    } finally {
      setMatching(false)
    }
  }

  const handleAutoMatch = async () => {
    if (matching) {
      console.log('이미 매칭 진행 중')
      return
    }
    
    // 모든 미완납 세금계산서와 사용 가능한 입금으로 자동 매칭
    const invoiceIds = status?.invoices.map(inv => inv.id) || []
    const depositIds = status?.deposits.map(dep => dep.id) || []

    if (invoiceIds.length === 0 || depositIds.length === 0) {
      alert('매칭할 항목이 없습니다.')
      return
    }
    
    setMatching(true)
    try {

      const response = await fetch('/api/matching/sequential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          invoiceIds,
          depositIds
        })
      })

      const result = await response.json()
      if (result.success) {
        alert(`자동 매칭 완료: ${result.data.summary.total_matched}건`)
        fetchCustomerStatus()
      }
    } catch (error) {
      console.error('Error auto matching:', error)
      alert('자동 매칭 중 오류가 발생했습니다.')
    } finally {
      setMatching(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!status) return null

  const completionRate = status.total_invoice_amount > 0 
    ? (status.total_received_amount / status.total_invoice_amount) * 100 
    : 0

  const availableDeposit = status.deposits.reduce((sum, dep) => sum + dep.remaining_amount, 0)

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown /> : <ChevronRight />}
            <CardTitle>{status.company_name}</CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              수금률: {completionRate.toFixed(1)}%
            </div>
            <Progress value={completionRate} className="w-32" />
            <Badge className={status.total_remaining === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
              미수금: {formatKRW(status.total_remaining)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* 미완납 세금계산서 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">미완납 세금계산서</h3>
                <div className="text-sm text-muted-foreground">
                  총 {formatKRW(status.total_remaining)} 미수
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox 
                        checked={selectedInvoices.length === status.invoices.length && status.invoices.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedInvoices(status.invoices.map(inv => inv.id))
                          } else {
                            setSelectedInvoices([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>발행일</TableHead>
                    <TableHead>승인번호</TableHead>
                    <TableHead className="text-right">총액</TableHead>
                    <TableHead className="text-right">받은금액</TableHead>
                    <TableHead className="text-right">미수금</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {status.invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedInvoices.includes(invoice.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedInvoices([...selectedInvoices, invoice.id])
                            } else {
                              setSelectedInvoices(selectedInvoices.filter(id => id !== invoice.id))
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>{formatDate(invoice.creation_date)}</TableCell>
                      <TableCell className="text-xs">{invoice.approval_number}</TableCell>
                      <TableCell className="text-right">{formatKRW(invoice.total_amount)}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatKRW(invoice.matched_amount)}
                      </TableCell>
                      <TableCell className="text-right text-red-600 font-semibold">
                        {formatKRW(invoice.remaining_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {status.invoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        미완납 세금계산서가 없습니다
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* 사용 가능한 입금 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">사용 가능한 입금</h3>
                <div className="text-sm text-muted-foreground">
                  총 {formatKRW(availableDeposit)} 사용 가능
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox 
                        checked={selectedDeposits.length === status.deposits.length && status.deposits.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDeposits(status.deposits.map(dep => dep.id))
                          } else {
                            setSelectedDeposits([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>입금일</TableHead>
                    <TableHead>입금자명</TableHead>
                    <TableHead className="text-right">입금액</TableHead>
                    <TableHead className="text-right">사용액</TableHead>
                    <TableHead className="text-right">잔액</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {status.deposits.map((deposit) => (
                    <TableRow key={deposit.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedDeposits.includes(deposit.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDeposits([...selectedDeposits, deposit.id])
                            } else {
                              setSelectedDeposits(selectedDeposits.filter(id => id !== deposit.id))
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>{formatDate(deposit.transaction_date)}</TableCell>
                      <TableCell>{deposit.deposit_name}</TableCell>
                      <TableCell className="text-right">{formatKRW(deposit.deposit_amount)}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatKRW(deposit.deposit_amount - deposit.remaining_amount)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600 font-semibold">
                        {formatKRW(deposit.remaining_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {status.deposits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        사용 가능한 입금이 없습니다
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* 매칭 액션 */}
          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              {selectedInvoices.length > 0 && selectedDeposits.length > 0 && (
                <span>
                  선택: 세금계산서 {selectedInvoices.length}건, 입금 {selectedDeposits.length}건
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleAutoMatch}
                disabled={matching || status.invoices.length === 0 || status.deposits.length === 0}
              >
                <Calculator className="w-4 h-4 mr-2" />
                전체 자동 매칭
              </Button>
              <Button
                onClick={handleSequentialMatch}
                disabled={matching || selectedInvoices.length === 0 || selectedDeposits.length === 0}
              >
                선택 항목 매칭
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}