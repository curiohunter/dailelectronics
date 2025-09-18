"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { ReceivablesTable, CustomerReceivable } from "@/components/dashboard/ReceivablesTable"
import { CustomerDetailModal } from "@/components/dashboard/CustomerDetailModal"
import { createClient } from "@/lib/supabase/client"

interface ReceivablesSummary {
  totalCustomers: number
  monthlyInvoiceTotal: number
  completedCount: number
  completedAmount: number
  unpaidCount: number
  unpaidAmount: number
  overpaidCount: number
  overpaidAmount: number
  topCustomers: Array<{
    name: string
    amount: number
  }>
  otherDeposits: {
    internal: { count: number; amount: number }
    external: { count: number; amount: number }
  }
  selectedMonth: Date
}

export default function DashboardPage() {
  const [customers, setCustomers] = useState<CustomerReceivable[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)) // Previous month
  const [summary, setSummary] = useState<ReceivablesSummary>({
    totalCustomers: 0,
    monthlyInvoiceTotal: 0,
    completedCount: 0,
    completedAmount: 0,
    unpaidCount: 0,
    unpaidAmount: 0,
    overpaidCount: 0,
    overpaidAmount: 0,
    topCustomers: [],
    otherDeposits: {
      internal: { count: 0, amount: 0 },
      external: { count: 0, amount: 0 }
    },
    selectedMonth: selectedMonth
  })
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerReceivable | null>(null)

  useEffect(() => {
    fetchReceivablesData()
  }, [selectedMonth])

  const fetchReceivablesData = async () => {
    try {
      setLoading(true)

      // Create authenticated Supabase client
      const supabase = createClient()

      // Fetch all necessary data
      interface Customer {
        id: string
        company_name: string
        phone: string | null
        notes: string | null
      }
      
      interface Invoice {
        id: string
        total_amount: number
        remaining_amount: number | null
        issue_date: string
        is_matched: boolean | null
      }
      
      interface Deposit {
        id: string
        deposit_amount: number
        remaining_amount: number | null
        transaction_date: string
        is_matched: boolean | null
      }
      
      interface InvoiceRelation {
        tax_invoice_id: string
        customer_id: string | null
      }
      
      interface DepositRelation {
        bank_deposit_id: string
        customer_id: string | null
      }
      
      const [
        { data: customersData, error: customersError },
        { data: invoicesData, error: invoicesError },
        { data: depositsData, error: depositsError },
        { data: invoiceRelationsData, error: invoiceRelationsError },
        { data: depositRelationsData, error: depositRelationsError },
        { data: classificationsData, error: classificationsError }
      ] = await Promise.all([
        supabase.from('customers').select('*'),
        supabase.from('tax_invoices').select('*'),
        supabase.from('bank_deposits').select('*'),
        supabase.from('customer_tax_invoices').select('*'),
        supabase.from('customer_bank_deposits').select('*'),
        supabase.from('bank_deposit_classifications').select('*')
      ])
      
      const customers = customersData as Customer[] | null
      const invoices = invoicesData as Invoice[] | null
      const deposits = depositsData as Deposit[] | null
      const invoiceRelations = invoiceRelationsData as InvoiceRelation[] | null
      const depositRelations = depositRelationsData as DepositRelation[] | null


      // Calculate totals per customer
      const customerMap = new Map<string, CustomerReceivable>()
      
      // Initialize customers
      customers?.forEach(customer => {
        customerMap.set(customer.id, {
          id: customer.id,
          companyName: customer.company_name,
          phone: customer.phone,
          invoiceAmount: 0,
          depositAmount: 0,
          balance: 0,
          overdueDays: null,
          status: 'complete',
          oldestUnpaidDate: null,
          notes: customer.notes,
          latestInvoiceDate: null,
          latestDepositDate: null,
          hasOtherDeposits: false
        })
      })

      // Collect invoices per customer for FIFO calculation
      const customerInvoices = new Map<string, any[]>()
      
      // Add invoice amounts and track latest invoice date
      invoiceRelations?.forEach(rel => {
        const invoice = invoices?.find(inv => inv.id === rel.tax_invoice_id)
        if (invoice && rel.customer_id) {
          const customer = customerMap.get(rel.customer_id)
          if (customer) {
            customer.invoiceAmount += invoice.total_amount
            
            // Track latest invoice date
            if (!customer.latestInvoiceDate || 
                new Date(invoice.issue_date) > new Date(customer.latestInvoiceDate)) {
              customer.latestInvoiceDate = invoice.issue_date
            }
            
            // Collect invoices for FIFO
            if (!customerInvoices.has(rel.customer_id)) {
              customerInvoices.set(rel.customer_id, [])
            }
            customerInvoices.get(rel.customer_id)?.push(invoice)
          }
        }
      })
      
      // Add deposit amounts and track latest deposit date
      depositRelations?.forEach(rel => {
        const deposit = deposits?.find(dep => dep.id === rel.bank_deposit_id)
        if (deposit && rel.customer_id) {
          const customer = customerMap.get(rel.customer_id)
          if (customer) {
            customer.depositAmount += deposit.deposit_amount
            
            // Track latest deposit date
            if (!customer.latestDepositDate || 
                new Date(deposit.transaction_date) > new Date(customer.latestDepositDate)) {
              customer.latestDepositDate = deposit.transaction_date
            }
          }
        }
      })
      
      // Calculate balance, status, and overdue days using FIFO
      const today = new Date()
      customerMap.forEach((customer, customerId) => {
        customer.balance = customer.depositAmount - customer.invoiceAmount
        
        if (customer.balance === 0) {
          customer.status = 'complete'
        } else if (customer.balance < 0) {
          customer.status = 'unpaid'
          
          // FIFO calculation for actual unpaid invoice date
          const invoiceList = customerInvoices.get(customerId) || []
          invoiceList.sort((a, b) => new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime())

          let remainingDeposit = customer.depositAmount
          let actualUnpaidDate: string | null = null

          for (const invoice of invoiceList) {
            if (remainingDeposit >= invoice.total_amount) {
              remainingDeposit -= invoice.total_amount
            } else {
              // This is the first unpaid (or partially paid) invoice
              actualUnpaidDate = invoice.issue_date
              break
            }
          }

          if (actualUnpaidDate) {
            const unpaidDate = new Date(actualUnpaidDate)
            const diffTime = today.getTime() - unpaidDate.getTime()
            // Only count as overdue if the invoice date is in the past
            customer.overdueDays = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0
            customer.oldestUnpaidDate = actualUnpaidDate
          }
        } else {
          customer.status = 'overpaid'
        }
      })
      
      // Calculate summary statistics
      const selectedMonthNum = selectedMonth.getMonth()
      const selectedYear = selectedMonth.getFullYear()
      const monthlyInvoices = invoices?.filter(inv => {
        const date = new Date(inv.issue_date)
        return date.getMonth() === selectedMonthNum && date.getFullYear() === selectedYear
      }) || []

      const customersArray = Array.from(customerMap.values())
      const completed = customersArray.filter(c => c.status === 'complete')
      const unpaid = customersArray.filter(c => c.status === 'unpaid')
      const overpaid = customersArray.filter(c => c.status === 'overpaid')

      // Calculate completed amount (sum of invoice amounts for completed customers)
      const completedAmount = completed.reduce((sum, c) => sum + c.invoiceAmount, 0)

      // Calculate Top 3 customers by invoice amount
      const topCustomers = customersArray
        .sort((a, b) => b.invoiceAmount - a.invoiceAmount)
        .slice(0, 3)
        .map(c => ({
          name: c.companyName,
          amount: c.invoiceAmount
        }))

      // Calculate other deposits statistics for selected month (same as invoices)
      const otherDeposits = {
        internal: { count: 0, amount: 0 },
        external: { count: 0, amount: 0 }
      }

      // Track customers who have other deposits
      const customersWithOtherDeposits = new Set<string>()

      if (classificationsData && classificationsData.length > 0) {
        classificationsData.forEach((classification: any) => {
          // Find the deposit from deposits data
          const deposit = deposits?.find(d => d.id === classification.bank_deposit_id)

          if (deposit) {
            const depositDate = new Date(deposit.transaction_date)

            // Filter by selected month (same logic as monthlyInvoices)
            if (depositDate.getMonth() === selectedMonthNum && depositDate.getFullYear() === selectedYear) {
              // Convert string to number (Supabase returns decimal as string)
              const amount = parseFloat(deposit.deposit_amount)

              // Find the customer associated with this deposit
              const depositRelation = depositRelations?.find(dr => dr.bank_deposit_id === classification.bank_deposit_id)
              if (depositRelation?.customer_id) {
                customersWithOtherDeposits.add(depositRelation.customer_id)
              }

              if (classification.classification_type === 'internal') {
                otherDeposits.internal.count++
                otherDeposits.internal.amount += amount
              } else if (classification.classification_type === 'external') {
                otherDeposits.external.count++
                otherDeposits.external.amount += amount
              }
            }
          }
        })
      }

      // Mark customers who have other deposits
      customersWithOtherDeposits.forEach(customerId => {
        const customer = customerMap.get(customerId)
        if (customer) {
          customer.hasOtherDeposits = true
        }
      })

      setSummary(prev => ({
        ...prev,
        totalCustomers: customers?.length || 0, // Total customers, not just active ones
        monthlyInvoiceTotal: monthlyInvoices.reduce((sum, inv) => sum + inv.total_amount, 0),
        completedCount: completed.length,
        completedAmount,
        unpaidCount: unpaid.length,
        unpaidAmount: unpaid.reduce((sum, c) => sum + Math.abs(c.balance), 0),
        overpaidCount: overpaid.length,
        overpaidAmount: overpaid.reduce((sum, c) => sum + c.balance, 0),
        topCustomers,
        otherDeposits,
        selectedMonth: selectedMonth  // selectedMonth 업데이트 추가
      }))
      
      setCustomers(customersArray)
    } catch (error) {
      console.error('Error fetching receivables data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerClick = (customer: CustomerReceivable) => {
    setSelectedCustomer(customer)
  }

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newMonth = new Date(selectedMonth)
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setSelectedMonth(newMonth)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">미수금 관리</h1>
          <p className="text-muted-foreground">
            업체별 세금계산서와 입금 총액 비교
          </p>
        </div>

        {/* Statistics Cards */}
        <DashboardStats summary={summary} onMonthChange={handleMonthChange} />

        {/* Receivables Table */}
        <ReceivablesTable 
          customers={customers}
          loading={loading}
          onCustomerClick={handleCustomerClick}
        />

        {/* Customer Detail Modal */}
        <CustomerDetailModal 
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      </div>
    </DashboardLayout>
  )
}