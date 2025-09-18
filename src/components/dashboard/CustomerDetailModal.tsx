"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { CustomerReceivable } from "./ReceivablesTable"
import { DownloadIcon, PrinterIcon, SaveIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import * as XLSX from 'xlsx'

interface CustomerDetailModalProps {
  customer: CustomerReceivable | null
  onClose: () => void
}

interface CustomerDetails {
  invoices: any[]
  deposits: any[]
}

export function CustomerDetailModal({ customer, onClose }: CustomerDetailModalProps) {
  // 한국 시간대로 현재 월의 첫날과 마지막날 계산
  const getKoreanMonthRange = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    
    // 현재 월의 첫날 (한국 시간)
    const firstDay = new Date(year, month, 1)
    
    // 현재 월의 마지막날 (한국 시간)
    const lastDay = new Date(year, month + 1, 0)
    
    // YYYY-MM-DD 형식으로 변환
    const formatDate = (date: Date) => {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }
    
    return {
      start: formatDate(firstDay),
      end: formatDate(lastDay)
    }
  }

  const [dateRange, setDateRange] = useState(getKoreanMonthRange())
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({ invoices: [], deposits: [] })
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [memo, setMemo] = useState('')
  const [memoSaving, setMemoSaving] = useState(false)

  useEffect(() => {
    if (customer) {
      fetchCustomerDetails()
      fetchCustomerMemo()
    }
  }, [customer])

  const fetchCustomerMemo = async () => {
    if (!customer) return

    try {
      interface CustomerNotes {
        notes: string | null
      }

      const supabase = createClient()
      const { data } = await supabase
        .from('customers')
        .select('notes')
        .eq('id', customer.id)
        .single()
      
      const customerData = data as CustomerNotes | null
      
      if (customerData?.notes) {
        setMemo(customerData.notes)
      }
    } catch (error) {
      console.error('Error fetching customer memo:', error)
    }
  }

  const saveMemo = async () => {
    if (!customer) return

    try {
      setMemoSaving(true)
      const supabase = createClient()
      const { error } = await supabase
        .from('customers')
        .update({ notes: memo })
        .eq('id', customer.id)
      
      if (error) throw error
      alert('메모가 저장되었습니다.')
    } catch (error) {
      console.error('Error saving memo:', error)
      alert('메모 저장 중 오류가 발생했습니다.')
    } finally {
      setMemoSaving(false)
    }
  }

  const fetchCustomerDetails = async () => {
    if (!customer) return

    try {
      setDetailsLoading(true)

      const supabase = createClient()

      // Fetch invoices with date range filter
      interface InvoiceRelation {
        tax_invoice_id: string
      }

      const { data: invoiceRelationsData } = await supabase
        .from('customer_tax_invoices')
        .select('tax_invoice_id')
        .eq('customer_id', customer.id)
      
      const invoiceRelations = invoiceRelationsData as InvoiceRelation[] | null
      const invoiceIds = invoiceRelations?.map(r => r.tax_invoice_id) || []
      
      let invoices: any[] = []
      if (invoiceIds.length > 0) {
        const { data } = await supabase
          .from('tax_invoices')
          .select('*')
          .in('id', invoiceIds)
          .gte('issue_date', dateRange.start)
          .lte('issue_date', dateRange.end)
          .order('issue_date', { ascending: false })
        
        invoices = data || []
      }
      
      // Fetch deposits with date range filter
      interface DepositRelation {
        bank_deposit_id: string
      }
      
      const { data: depositRelationsData } = await supabase
        .from('customer_bank_deposits')
        .select('bank_deposit_id')
        .eq('customer_id', customer.id)
      
      const depositRelations = depositRelationsData as DepositRelation[] | null
      const depositIds = depositRelations?.map(r => r.bank_deposit_id) || []
      
      let deposits: any[] = []
      if (depositIds.length > 0) {
        const { data } = await supabase
          .from('bank_deposits')
          .select('*')
          .in('id', depositIds)
          .gte('transaction_date', dateRange.start)
          .lte('transaction_date', dateRange.end)
          .order('transaction_date', { ascending: false })
        
        deposits = data || []
      }
      
      setCustomerDetails({
        invoices: invoices || [],
        deposits: deposits || []
      })
    } catch (error) {
      console.error('Error fetching customer details:', error)
    } finally {
      setDetailsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const exportToExcel = () => {
    if (!customer || !customerDetails) return

    // 세금계산서 데이터 준비
    const invoicesData = customerDetails.invoices.map(inv => ({
      '발행일': new Date(inv.issue_date).toLocaleDateString('ko-KR'),
      '금액': inv.total_amount,
      '구분': '세금계산서'
    }))

    // 입금내역 데이터 준비
    const depositsData = customerDetails.deposits.map(dep => ({
      '입금일': new Date(dep.transaction_date).toLocaleDateString('ko-KR'),
      '금액': dep.deposit_amount || 0,
      '구분': '입금'
    }))

    // 요약 데이터
    const summaryData = [{
      '업체명': customer.companyName,
      '조회기간': `${dateRange.start} ~ ${dateRange.end}`,
      '세금계산서 합계': customerDetails.invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
      '입금 합계': customerDetails.deposits.reduce((sum, dep) => sum + (dep.deposit_amount || 0), 0),
      '잔액': customer.balance,
      '상태': customer.status === 'complete' ? '수금완료' : 
              customer.status === 'unpaid' ? '미수금' : '과납금'
    }]

    // 워크북 생성
    const wb = XLSX.utils.book_new()
    
    // 요약 시트
    const summaryWs = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summaryWs, '요약')
    
    // 세금계산서 시트
    if (invoicesData.length > 0) {
      const invoicesWs = XLSX.utils.json_to_sheet(invoicesData)
      XLSX.utils.book_append_sheet(wb, invoicesWs, '세금계산서')
    }
    
    // 입금내역 시트
    if (depositsData.length > 0) {
      const depositsWs = XLSX.utils.json_to_sheet(depositsData)
      XLSX.utils.book_append_sheet(wb, depositsWs, '입금내역')
    }

    // 파일 다운로드
    const fileName = `${customer.companyName}_거래내역_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  const handlePrint = () => {
    if (!customer) return

    // 인쇄용 새 창 생성
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    // 인쇄용 HTML 생성
    const printContent = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <title>${customer.companyName} 거래내역</title>
        <style>
          body { font-family: 'Malgun Gothic', sans-serif; padding: 20px; }
          h1 { font-size: 20px; margin-bottom: 10px; }
          h2 { font-size: 16px; margin-top: 20px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .text-right { text-align: right; }
          .summary { background-color: #f9f9f9; padding: 10px; margin-bottom: 20px; border-radius: 5px; }
          .status-complete { color: green; font-weight: bold; }
          .status-unpaid { color: red; font-weight: bold; }
          .status-overpaid { color: blue; font-weight: bold; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${customer.companyName} 거래내역</h1>
        <div class="summary">
          <p><strong>조회기간:</strong> ${dateRange.start} ~ ${dateRange.end}</p>
          <p><strong>전화번호:</strong> ${customer.phone || '-'}</p>
          <p class="${customer.status === 'complete' ? 'status-complete' : 
                       customer.status === 'unpaid' ? 'status-unpaid' : 'status-overpaid'}">
            <strong>상태:</strong> ${customer.status === 'complete' ? '수금완료' : 
                                     customer.status === 'unpaid' ? `미수금: ${formatCurrency(Math.abs(customer.balance))}` : 
                                     `과납금: ${formatCurrency(customer.balance)}`}
          </p>
        </div>

        <h2>세금계산서 (${customerDetails.invoices.length}건)</h2>
        <table>
          <thead>
            <tr>
              <th>발행일</th>
              <th class="text-right">금액</th>
            </tr>
          </thead>
          <tbody>
            ${customerDetails.invoices.map(inv => `
              <tr>
                <td>${new Date(inv.issue_date).toLocaleDateString('ko-KR')}</td>
                <td class="text-right">${formatCurrency(inv.total_amount)}</td>
              </tr>
            `).join('')}
            <tr>
              <th>합계</th>
              <th class="text-right">${formatCurrency(customerDetails.invoices.reduce((sum, inv) => sum + inv.total_amount, 0))}</th>
            </tr>
          </tbody>
        </table>

        <h2>입금내역 (${customerDetails.deposits.length}건)</h2>
        <table>
          <thead>
            <tr>
              <th>입금일</th>
              <th class="text-right">금액</th>
            </tr>
          </thead>
          <tbody>
            ${customerDetails.deposits.map(dep => `
              <tr>
                <td>${new Date(dep.transaction_date).toLocaleDateString('ko-KR')}</td>
                <td class="text-right">${formatCurrency(dep.deposit_amount || 0)}</td>
              </tr>
            `).join('')}
            <tr>
              <th>합계</th>
              <th class="text-right">${formatCurrency(customerDetails.deposits.reduce((sum, dep) => sum + (dep.deposit_amount || 0), 0))}</th>
            </tr>
          </tbody>
        </table>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            }
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
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

  if (!customer) return null

  return (
    <Dialog open={!!customer} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {customer.companyName} 상세 내역
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm">기간 설정:</span>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-40"
            />
            <span>~</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-40"
            />
            <Button
              size="sm"
              onClick={fetchCustomerDetails}
            >
              조회
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDateRange(getKoreanMonthRange())}
            >
              이번달
            </Button>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-4">
            {/* Tax Invoices */}
            <div>
              <h3 className="text-sm font-semibold mb-2">📄 세금계산서 (최신순)</h3>
              <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                {detailsLoading ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    로딩 중...
                  </div>
                ) : customerDetails.invoices.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    해당 기간에 세금계산서가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerDetails.invoices.map((invoice, idx) => (
                      <div key={invoice.id} className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          {new Date(invoice.issue_date).toLocaleDateString('ko-KR')}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(invoice.total_amount)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t flex justify-between font-semibold">
                      <span>합계:</span>
                      <span>
                        {formatCurrency(
                          customerDetails.invoices.reduce((sum, inv) => sum + inv.total_amount, 0)
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bank Deposits */}
            <div>
              <h3 className="text-sm font-semibold mb-2">💰 입금내역 (최신순)</h3>
              <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                {detailsLoading ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    로딩 중...
                  </div>
                ) : customerDetails.deposits.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    해당 기간에 입금내역이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerDetails.deposits.map((deposit, idx) => (
                      <div key={deposit.id} className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          {new Date(deposit.transaction_date).toLocaleDateString('ko-KR')}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(deposit.deposit_amount || 0)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t flex justify-between font-semibold">
                      <span>합계:</span>
                      <span>
                        {formatCurrency(
                          customerDetails.deposits.reduce((sum, dep) => sum + (dep.deposit_amount || 0), 0)
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Balance Summary */}
          <div className="flex justify-center">
            <div className={cn(
              "px-6 py-3 rounded-lg border-2",
              customer.status === 'complete' ? 'border-green-500 bg-green-50' :
              customer.status === 'unpaid' ? 'border-red-500 bg-red-50' :
              'border-blue-500 bg-blue-50'
            )}>
              <div className={cn(
                "text-lg font-bold",
                getStatusColor(customer.status)
              )}>
                {customer.status === 'complete' ? '수금 완료' :
                 customer.status === 'unpaid' ? 
                 `미수금: ${formatCurrency(Math.abs(customer.balance))} (🔴)` :
                 `과납금: ${formatCurrency(customer.balance)} (🔵)`}
              </div>
            </div>
          </div>

          {/* Memo Section */}
          <div>
            <label className="text-sm font-semibold">메모:</label>
            <textarea
              className="w-full mt-1 p-2 border rounded-lg"
              rows={3}
              placeholder="메모를 입력하세요..."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportToExcel}
            >
              <DownloadIcon className="h-4 w-4 mr-1" />
              엑셀 다운로드
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePrint}
            >
              <PrinterIcon className="h-4 w-4 mr-1" />
              인쇄
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={saveMemo}
              disabled={memoSaving}
            >
              <SaveIcon className="h-4 w-4 mr-1" />
              {memoSaving ? '저장 중...' : '메모 저장'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}