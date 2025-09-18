"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CustomersTable } from "@/components/matching/CustomersTable"
import { CustomerModal } from "@/components/matching/CustomerModal"
import { TaxInvoicesTab } from "@/components/matching/TaxInvoicesTab"
import { TaxInvoiceModal } from "@/components/matching/TaxInvoiceModal"
import { BankDepositsTab } from "@/components/matching/BankDepositsTab"
import { BankDepositModal } from "@/components/matching/BankDepositModal"
import { OtherDepositsTab } from "@/components/matching/OtherDepositsTab"
import { OtherDepositModal } from "@/components/matching/OtherDepositModal"
import { FileUploadCard } from "@/components/matching/FileUploadCard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Plus } from "lucide-react"

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

interface CustomerTaxInvoice {
  id: string
  customer_id: string | null
  tax_invoice_id: string
  created_at: string | null
  updated_at: string | null
  customer?: Customer | null
  tax_invoice?: TaxInvoice | null
}

interface CustomerBankDeposit {
  id: string
  customer_id: string | null
  bank_deposit_id: string
  created_at: string | null
  updated_at: string | null
  customer?: Customer | null
  bank_deposit?: BankDeposit | null
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

export default function MatchingPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState("customers")
  const [loading, setLoading] = useState(false)

  // Data states
  const [customers, setCustomers] = useState<Customer[]>([])
  const [taxInvoices, setTaxInvoices] = useState<TaxInvoice[]>([])
  const [bankDeposits, setBankDeposits] = useState<BankDeposit[]>([])
  const [invoiceRelations, setInvoiceRelations] = useState<CustomerTaxInvoice[]>([])
  const [depositRelations, setDepositRelations] = useState<CustomerBankDeposit[]>([])
  const [otherDeposits, setOtherDeposits] = useState<OtherDeposit[]>([])
  
  // File upload states
  const [uploadingInvoice, setUploadingInvoice] = useState(false)
  const [uploadingDeposit, setUploadingDeposit] = useState(false)
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [depositFile, setDepositFile] = useState<File | null>(null)
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("")
  const [customerSearchQuery, setCustomerSearchQuery] = useState("")
  
  // Modal states
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<TaxInvoice | null>(null)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [editingDeposit, setEditingDeposit] = useState<BankDeposit | null>(null)
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [editingOtherDeposit, setEditingOtherDeposit] = useState<OtherDeposit | null>(null)
  const [isOtherDepositModalOpen, setIsOtherDepositModalOpen] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      // Fetch all data in parallel
      const [
        { data: customersData },
        { data: invoicesData },
        { data: depositsData },
        { data: invoiceRelationsData },
        { data: depositRelationsData }
      ] = await Promise.all([
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('tax_invoices').select('*').order('issue_date', { ascending: false }),
        supabase.from('bank_deposits').select('*').order('transaction_date', { ascending: false }),
        supabase.from('customer_tax_invoices').select('*, customer:customers(*), tax_invoice:tax_invoices(*)'),
        supabase.from('customer_bank_deposits').select('*, customer:customers(*), bank_deposit:bank_deposits(*)')
      ])

      // Fetch classifications separately with error handling for 406
      let depositClassificationsData = null
      try {
        const { data } = await supabase
          .from('bank_deposit_classifications')
          .select(`
            *,
            deposit:bank_deposits(
              transaction_date,
              transaction_time,
              deposit_name,
              deposit_amount
            )
          `)
        depositClassificationsData = data
      } catch (error) {
        console.log('Classifications fetch skipped:', error)
      }

      setCustomers(customersData || [])
      
      // Process tax invoices with relationship status
      const processedInvoices = (invoicesData || []).map((invoice: any) => {
        const relation = invoiceRelationsData?.find((rel: any) => rel.tax_invoice_id === invoice.id) as any
        return {
          ...invoice,
          hasRelation: !!relation?.customer_id,
          relatedCustomer: relation?.customer || null
        }
      })
      setTaxInvoices(processedInvoices)

      // Process bank deposits with relationship status and classifications
      const processedDeposits = (depositsData || []).map((deposit: any) => {
        const relation = depositRelationsData?.find((rel: any) => rel.bank_deposit_id === deposit.id) as any
        const classification = depositClassificationsData?.find((cls: any) => cls.bank_deposit_id === deposit.id) as any
        return {
          ...deposit,
          hasRelation: !!relation?.customer_id,
          relatedCustomer: relation?.customer || null,
          classification: classification ? {
            classification_type: classification.classification_type,
            classification_detail: classification.classification_detail
          } : null
        }
      })
      setBankDeposits(processedDeposits)
      
      setInvoiceRelations(invoiceRelationsData || [])
      setDepositRelations(depositRelationsData || [])
      setOtherDeposits(depositClassificationsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "오류",
        description: "데이터를 불러오는데 실패했습니다.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInvoiceUpload = async () => {
    if (!invoiceFile) return

    setUploadingInvoice(true)
    const formData = new FormData()
    formData.append('file', invoiceFile)

    try {
      const response = await fetch('/api/upload/tax-invoice', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      toast({
        title: "업로드 성공",
        description: result.message || `${result.data?.invoices?.saved || 0}개의 세금계산서가 업로드되었습니다.`,
      })

      setInvoiceFile(null)
      fetchAllData()
    } catch (error: any) {
      toast({
        title: "업로드 실패",
        description: error.message || "파일 업로드 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setUploadingInvoice(false)
    }
  }

  const handleDepositUpload = async () => {
    if (!depositFile) return

    setUploadingDeposit(true)
    const formData = new FormData()
    formData.append('file', depositFile)

    try {
      const response = await fetch('/api/upload/bank-deposit', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      toast({
        title: "업로드 성공",
        description: result.message || `${result.data?.deposits?.saved || 0}개의 입금내역이 업로드되었습니다.`,
      })

      setDepositFile(null)
      fetchAllData()
    } catch (error: any) {
      toast({
        title: "업로드 실패",
        description: error.message || "파일 업로드 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setUploadingDeposit(false)
    }
  }

  const handleConnectInvoice = async (invoiceId: string, customerId: string) => {
    try {
      // Check if relation exists
      const { data: existingRelation } = await supabase
        .from('customer_tax_invoices')
        .select('*')
        .eq('tax_invoice_id', invoiceId)
        .single()

      if (existingRelation) {
        // Update existing relation
        const { error } = await (supabase as any)
          .from('customer_tax_invoices')
          .update({ customer_id: customerId })
          .eq('tax_invoice_id', invoiceId)
        
        if (error) throw error
      } else {
        // Create new relation
        const { error } = await (supabase as any)
          .from('customer_tax_invoices')
          .insert({ tax_invoice_id: invoiceId, customer_id: customerId })
        
        if (error) throw error
      }

      // 고객사 정보 가져오기
      const { data: customer } = await supabase
        .from('customers')
        .select('id, company_name')
        .eq('id', customerId)
        .single()

      toast({
        title: "연결 성공",
        description: "세금계산서가 고객사와 연결되었습니다.",
      })

      // 로컬 상태만 업데이트 (새로고침 없이)
      setTaxInvoices(prevInvoices =>
        prevInvoices.map(inv => {
          if (inv.id === invoiceId) {
            return {
              ...inv,
              hasRelation: true,
              relatedCustomer: customer || null
            }
          }
          return inv
        })
      )
    } catch (error) {
      console.error('Error connecting invoice:', error)
      toast({
        title: "연결 실패",
        description: "연결 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  const handleConnectDeposit = async (depositId: string, customerId: string) => {
    try {
      // 1. 입금내역 정보 가져오기
      const { data: deposit } = await supabase
        .from('bank_deposits')
        .select('deposit_name')
        .eq('id', depositId)
        .single() as { data: { deposit_name: string | null } | null, error: any }

      if (!deposit || !deposit.deposit_name) {
        throw new Error('입금내역 정보를 찾을 수 없습니다.')
      }

      // 2. 고객사 정보 가져오기
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single() as { data: Customer | null, error: any }

      if (!customer) {
        throw new Error('고객사 정보를 찾을 수 없습니다.')
      }

      // 3. 별칭 배열에 입금명 추가 (중복 체크)
      let updatedAliases = customer.alias_names || []
      const depositName = deposit.deposit_name.trim()

      if (!updatedAliases.includes(depositName)) {
        updatedAliases = [...updatedAliases, depositName]

        // 고객사 별칭 업데이트
        const { error: updateError } = await (supabase as any)
          .from('customers')
          .update({
            alias_names: updatedAliases,
            updated_at: new Date().toISOString()
          })
          .eq('id', customerId)

        if (updateError) {
          console.error('별칭 업데이트 오류:', updateError)
        } else {
          console.log(`고객사 ${customer.company_name}에 별칭 "${depositName}" 추가됨`)
        }
      }

      // 4. 현재 입금내역 연결
      const { data: existingRelation } = await supabase
        .from('customer_bank_deposits')
        .select('*')
        .eq('bank_deposit_id', depositId)
        .single()

      if (existingRelation) {
        // Update existing relation
        const { error } = await (supabase as any)
          .from('customer_bank_deposits')
          .update({ customer_id: customerId })
          .eq('bank_deposit_id', depositId)

        if (error) throw error
      } else {
        // Create new relation
        const { error } = await (supabase as any)
          .from('customer_bank_deposits')
          .insert({ bank_deposit_id: depositId, customer_id: customerId })

        if (error) throw error
      }

      // 5. 같은 입금명을 가진 미연결 입금내역들 자동 연결
      const { data: unconnectedDeposits } = await supabase
        .from('bank_deposits')
        .select('id')
        .eq('deposit_name', deposit.deposit_name)
        .neq('id', depositId) as { data: { id: string }[] | null, error: any } // 현재 처리한 것 제외

      if (unconnectedDeposits && unconnectedDeposits.length > 0) {
        let autoConnectedCount = 0

        for (const unconnected of unconnectedDeposits) {
          // 기존 관계 확인
          const { data: existingRel } = await supabase
            .from('customer_bank_deposits')
            .select('customer_id')
            .eq('bank_deposit_id', unconnected.id)
            .single() as { data: { customer_id: string | null } | null, error: any }

          // 미연결 상태거나 customer_id가 null인 경우만 연결
          if (!existingRel || !existingRel.customer_id) {
            if (existingRel) {
              // 관계는 있지만 customer_id가 null인 경우 업데이트
              const { error } = await (supabase as any)
                .from('customer_bank_deposits')
                .update({ customer_id: customerId })
                .eq('bank_deposit_id', unconnected.id)

              if (!error) autoConnectedCount++
            } else {
              // 관계가 없는 경우 새로 생성
              const { error } = await (supabase as any)
                .from('customer_bank_deposits')
                .insert({
                  bank_deposit_id: unconnected.id,
                  customer_id: customerId
                })

              if (!error) autoConnectedCount++
            }
          }
        }

        if (autoConnectedCount > 0) {
          console.log(`같은 입금명 ${autoConnectedCount}개 자동 연결됨`)
        }
      }

      toast({
        title: "연결 성공",
        description: `입금내역이 ${customer.company_name}과 연결되었습니다. 같은 입금명의 다른 내역도 자동으로 연결됩니다.`,
      })

      // 로컬 상태만 업데이트 (새로고침 없이)
      setBankDeposits(prevDeposits =>
        prevDeposits.map(dep => {
          // 현재 연결한 입금내역과 같은 입금명을 가진 모든 항목 업데이트
          if (dep.deposit_name === deposit.deposit_name) {
            return {
              ...dep,
              hasRelation: true,
              relatedCustomer: customer
            }
          }
          return dep
        })
      )

      // 고객사 별칭 정보도 로컬 업데이트
      setCustomers(prevCustomers =>
        prevCustomers.map(cust => {
          if (cust.id === customerId) {
            return {
              ...cust,
              alias_names: updatedAliases
            }
          }
          return cust
        })
      )
    } catch (error) {
      console.error('Error connecting deposit:', error)
      toast({
        title: "연결 실패",
        description: error instanceof Error ? error.message : "연결 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  const handleClassifyDeposit = async (depositId: string, type: 'internal' | 'external', detail: string) => {
    try {
      // 1. bank_deposit_classifications 테이블에 레코드 생성 또는 업데이트
      const { data: existingClassification, error: selectError } = await supabase
        .from('bank_deposit_classifications')
        .select('*')
        .eq('bank_deposit_id', depositId)
        .maybeSingle()

      // 406 오류 무시
      if (selectError && !selectError.message.includes('406')) {
        throw selectError
      }

      if (existingClassification) {
        // 기존 분류 업데이트
        const { error } = await (supabase as any)
          .from('bank_deposit_classifications')
          .update({
            classification_type: type,
            classification_detail: detail,
            updated_at: new Date().toISOString()
          })
          .eq('bank_deposit_id', depositId)

        if (error) throw error
      } else {
        // 새 분류 생성
        const { error } = await (supabase as any)
          .from('bank_deposit_classifications')
          .insert({
            bank_deposit_id: depositId,
            classification_type: type,
            classification_detail: detail
          })

        if (error) throw error
      }

      // 2. 로컬 상태 업데이트
      setBankDeposits(prevDeposits =>
        prevDeposits.map(dep => {
          if (dep.id === depositId) {
            return {
              ...dep,
              classification: {
                classification_type: type,
                classification_detail: detail
              }
            }
          }
          return dep
        })
      )

      toast({
        title: "분류 성공",
        description: type === 'internal'
          ? `입금내역이 내부 경영으로 분류되었습니다.`
          : `입금내역이 외부 기타로 분류되었습니다.`,
      })
    } catch (error) {
      console.error('Error classifying deposit:', error)
      toast({
        title: "분류 실패",
        description: "분류 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  const handleAddCustomer = () => {
    setEditingCustomer(null)
    setIsCustomerModalOpen(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setIsCustomerModalOpen(true)
  }

  const handleDeleteCustomer = async (customer: Customer) => {
    if (!confirm(`정말 ${customer.company_name}을(를) 삭제하시겠습니까?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customer.id)

      if (error) throw error

      toast({
        title: "삭제 성공",
        description: "고객사가 삭제되었습니다.",
      })
      fetchAllData()
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast({
        title: "삭제 실패",
        description: "삭제 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  const handleSaveCustomer = async (customerData: Partial<Customer>) => {
    try {
      if (editingCustomer) {
        // Get current aliases to compare with new ones
        const { data: currentCustomer } = await supabase
          .from('customers')
          .select('alias_names')
          .eq('id', editingCustomer.id)
          .single() as { data: { alias_names: string[] | null } | null, error: any }

        const currentAliases = currentCustomer?.alias_names || []
        const newAliases = customerData.alias_names || []

        // Find removed aliases
        const removedAliases = currentAliases.filter(alias => !newAliases.includes(alias))

        // If aliases were removed, disconnect related bank deposits
        if (removedAliases.length > 0) {
          // Find all deposits with the removed aliases
          const { data: depositsToDisconnect } = await supabase
            .from('bank_deposits')
            .select('id')
            .in('deposit_name', removedAliases) as { data: { id: string }[] | null, error: any }

          if (depositsToDisconnect && depositsToDisconnect.length > 0) {
            const depositIds = depositsToDisconnect.map(d => d.id)

            // Remove the relationships for these deposits
            const { error: relationError } = await (supabase as any)
              .from('customer_bank_deposits')
              .delete()
              .eq('customer_id', editingCustomer.id)
              .in('bank_deposit_id', depositIds)

            if (relationError) throw relationError

            toast({
              title: "별칭 제거",
              description: `${removedAliases.length}개 별칭과 연결된 ${depositsToDisconnect.length}개 입금내역의 연결이 해제되었습니다.`,
            })
          }
        }

        // Update existing customer
        const { error } = await (supabase as any)
          .from('customers')
          .update(customerData)
          .eq('id', editingCustomer.id)

        if (error) throw error

        toast({
          title: "수정 성공",
          description: "고객사 정보가 수정되었습니다.",
        })
      } else {
        // Create new customer
        const { error } = await (supabase as any)
          .from('customers')
          .insert(customerData)

        if (error) throw error

        toast({
          title: "추가 성공",
          description: "새 고객사가 추가되었습니다.",
        })
      }

      setIsCustomerModalOpen(false)
      fetchAllData()
    } catch (error) {
      console.error('Error saving customer:', error)
      toast({
        title: "저장 실패",
        description: "저장 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  // Tax Invoice CRUD handlers
  const handleAddInvoice = () => {
    setEditingInvoice(null)
    setIsInvoiceModalOpen(true)
  }

  const handleEditInvoice = (invoice: TaxInvoice) => {
    setEditingInvoice(invoice)
    setIsInvoiceModalOpen(true)
  }

  const handleDeleteInvoice = async (invoice: TaxInvoice) => {
    if (!confirm(`정말 이 세금계산서를 삭제하시겠습니까?\n공급받는자: ${invoice.buyer_company_name}\n금액: ${invoice.total_amount.toLocaleString()}원`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('tax_invoices')
        .delete()
        .eq('id', invoice.id)

      if (error) throw error

      toast({
        title: "삭제 성공",
        description: "세금계산서가 삭제되었습니다.",
      })
      fetchAllData()
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast({
        title: "삭제 실패",
        description: "삭제 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  const handleSaveInvoice = async (invoiceData: Partial<TaxInvoice>) => {
    try {
      if (editingInvoice) {
        // Update existing invoice
        const { error } = await (supabase as any)
          .from('tax_invoices')
          .update(invoiceData)
          .eq('id', editingInvoice.id)

        if (error) throw error

        toast({
          title: "수정 성공",
          description: "세금계산서가 수정되었습니다.",
        })
      } else {
        // Create new invoice
        const { error } = await (supabase as any)
          .from('tax_invoices')
          .insert(invoiceData)

        if (error) throw error

        toast({
          title: "추가 성공",
          description: "새 세금계산서가 추가되었습니다.",
        })
      }

      setIsInvoiceModalOpen(false)
      fetchAllData()
    } catch (error) {
      console.error('Error saving invoice:', error)
      toast({
        title: "저장 실패",
        description: "저장 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  // Bank Deposit CRUD handlers
  const handleAddDeposit = () => {
    setEditingDeposit(null)
    setIsDepositModalOpen(true)
  }

  const handleEditDeposit = (deposit: BankDeposit) => {
    setEditingDeposit(deposit)
    setIsDepositModalOpen(true)
  }

  const handleDeleteDeposit = async (deposit: BankDeposit) => {
    if (!confirm(`정말 이 입금내역을 삭제하시겠습니까?\n입금자: ${deposit.deposit_name}\n금액: ${deposit.deposit_amount.toLocaleString()}원`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('bank_deposits')
        .delete()
        .eq('id', deposit.id)

      if (error) throw error

      toast({
        title: "삭제 성공",
        description: "입금내역이 삭제되었습니다.",
      })
      fetchAllData()
    } catch (error) {
      console.error('Error deleting deposit:', error)
      toast({
        title: "삭제 실패",
        description: "삭제 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  const handleSaveDeposit = async (depositData: Partial<BankDeposit> & { customer_id?: string | null }) => {
    try {
      // Extract customer_id from depositData
      const { customer_id, ...depositUpdateData } = depositData

      if (editingDeposit) {
        // Update existing deposit
        const { error: depositError } = await (supabase as any)
          .from('bank_deposits')
          .update(depositUpdateData)
          .eq('id', editingDeposit.id)

        if (depositError) throw depositError

        // Update customer relationship if customer_id is provided
        if (customer_id !== undefined) {
          // First, get existing relationship
          const { data: existingRelation } = await supabase
            .from('customer_bank_deposits')
            .select('id')
            .eq('bank_deposit_id', editingDeposit.id)
            .single()

          if (customer_id === null) {
            // Remove relationship if exists
            if (existingRelation) {
              const { error: deleteError } = await (supabase as any)
                .from('customer_bank_deposits')
                .delete()
                .eq('bank_deposit_id', editingDeposit.id)

              if (deleteError) throw deleteError
            }
          } else {
            // Update or create relationship
            if (existingRelation) {
              const { error: updateError } = await (supabase as any)
                .from('customer_bank_deposits')
                .update({ customer_id })
                .eq('bank_deposit_id', editingDeposit.id)

              if (updateError) throw updateError
            } else {
              const { error: insertError } = await (supabase as any)
                .from('customer_bank_deposits')
                .insert({ customer_id, bank_deposit_id: editingDeposit.id })

              if (insertError) throw insertError
            }

            // Update customer alias if deposit_name is set
            if (depositUpdateData.deposit_name) {
              const { data: customer } = await supabase
                .from('customers')
                .select('alias_names')
                .eq('id', customer_id)
                .single() as { data: { alias_names: string[] | null } | null, error: any }

              if (customer) {
                const currentAliases = customer.alias_names || []
                if (!currentAliases.includes(depositUpdateData.deposit_name)) {
                  const { error: aliasError } = await (supabase as any)
                    .from('customers')
                    .update({
                      alias_names: [...currentAliases, depositUpdateData.deposit_name]
                    })
                    .eq('id', customer_id)

                  if (aliasError) throw aliasError
                }
              }
            }
          }
        }

        toast({
          title: "수정 성공",
          description: "입금내역이 수정되었습니다.",
        })
      } else {
        // Create new deposit
        const { data: newDeposit, error: depositError } = await (supabase as any)
          .from('bank_deposits')
          .insert(depositUpdateData)
          .select()
          .single()

        if (depositError) throw depositError

        // Create relationship if customer_id is provided
        if (customer_id && newDeposit) {
          const { error: relationError } = await (supabase as any)
            .from('customer_bank_deposits')
            .insert({ customer_id, bank_deposit_id: newDeposit.id })

          if (relationError) throw relationError

          // Update customer alias
          if (depositUpdateData.deposit_name) {
            const { data: customer } = await supabase
              .from('customers')
              .select('alias_names')
              .eq('id', customer_id)
              .single() as { data: { alias_names: string[] | null } | null, error: any }

            if (customer) {
              const currentAliases = customer.alias_names || []
              if (!currentAliases.includes(depositUpdateData.deposit_name)) {
                const { error: aliasError } = await (supabase as any)
                  .from('customers')
                  .update({
                    alias_names: [...currentAliases, depositUpdateData.deposit_name]
                  })
                  .eq('id', customer_id)

                if (aliasError) throw aliasError
              }
            }
          }
        }

        toast({
          title: "추가 성공",
          description: "새 입금내역이 추가되었습니다.",
        })
      }

      setIsDepositModalOpen(false)
      fetchAllData()
    } catch (error) {
      console.error('Error saving deposit:', error)
      toast({
        title: "저장 실패",
        description: "저장 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  // Other Deposits (기타 입금) CRUD handlers
  const handleAddOtherDeposit = () => {
    setEditingOtherDeposit(null)
    setIsOtherDepositModalOpen(true)
  }

  const handleEditOtherDeposit = (deposit: OtherDeposit) => {
    setEditingOtherDeposit(deposit)
    setIsOtherDepositModalOpen(true)
  }

  const handleDeleteOtherDeposit = async (deposit: OtherDeposit) => {
    if (!confirm(`정말 이 기타 입금 분류를 삭제하시겠습니까?\n입금명: ${deposit.deposit?.deposit_name}\n상세: ${deposit.classification_detail}`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('bank_deposit_classifications')
        .delete()
        .eq('id', deposit.id)

      if (error) throw error

      toast({
        title: "삭제 성공",
        description: "기타 입금 분류가 삭제되었습니다.",
      })
      fetchAllData()
    } catch (error) {
      console.error('Error deleting other deposit:', error)
      toast({
        title: "삭제 실패",
        description: "삭제 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  const handleSaveOtherDeposit = async (data: {
    bank_deposit_id: string
    classification_type: 'internal' | 'external'
    classification_detail: string
  }) => {
    try {
      if (editingOtherDeposit) {
        // Update existing classification
        const { error } = await (supabase as any)
          .from('bank_deposit_classifications')
          .update({
            classification_type: data.classification_type,
            classification_detail: data.classification_detail,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingOtherDeposit.id)

        if (error) throw error

        toast({
          title: "수정 성공",
          description: "기타 입금 분류가 수정되었습니다.",
        })
      } else {
        // Create new classification
        const { error } = await (supabase as any)
          .from('bank_deposit_classifications')
          .insert({
            bank_deposit_id: data.bank_deposit_id,
            classification_type: data.classification_type,
            classification_detail: data.classification_detail
          })

        if (error) throw error

        toast({
          title: "추가 성공",
          description: "새 기타 입금 분류가 추가되었습니다.",
        })
      }

      setIsOtherDepositModalOpen(false)
      fetchAllData()
    } catch (error) {
      console.error('Error saving other deposit:', error)
      toast({
        title: "저장 실패",
        description: "저장 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  // 미분류 입금내역 (기타 입금 모달에서 사용)
  const availableDeposits = bankDeposits.filter(deposit =>
    !deposit.hasRelation && !deposit.classification
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">데이터 관리 센터</h1>
          <p className="text-muted-foreground">
            고객사, 세금계산서, 입금내역을 통합 관리합니다
          </p>
        </div>

        {/* File Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FileUploadCard
            title="세금계산서 업로드"
            icon="📊"
            description="국세청에서 다운로드한 파일을 업로드하세요 (XLS, XLSX)"
            file={invoiceFile}
            onFileSelect={setInvoiceFile}
            onUpload={handleInvoiceUpload}
            uploading={uploadingInvoice}
            acceptedFileTypes={{
              'text/csv': ['.csv'],
              'application/vnd.ms-excel': ['.xls'],
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              'application/octet-stream': ['.csv', '.xls', '.xlsx'],
              'application/excel': ['.xls'],
              'application/x-excel': ['.xls'],
              'application/x-msexcel': ['.xls']
            }}
          />
          
          <FileUploadCard
            title="입금내역 업로드"
            icon="💰"
            description="은행에서 다운로드한 거래내역을 업로드하세요 (XLS, XLSX)"
            file={depositFile}
            onFileSelect={setDepositFile}
            onUpload={handleDepositUpload}
            uploading={uploadingDeposit}
            acceptedFileTypes={{
              'application/vnd.ms-excel': ['.xls'],
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              'application/octet-stream': ['.xls', '.xlsx'],
              'application/excel': ['.xls'],
              'application/x-excel': ['.xls'],
              'application/x-msexcel': ['.xls']
            }}
          />
        </div>

        {/* Data Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="customers">고객사</TabsTrigger>
            <TabsTrigger value="invoices">세금계산서</TabsTrigger>
            <TabsTrigger value="deposits">입금내역</TabsTrigger>
            <TabsTrigger value="other-deposits">기타 입금</TabsTrigger>
          </TabsList>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>고객사 목록</CardTitle>
                  <Button onClick={handleAddCustomer}>
                    <Plus className="mr-2 h-4 w-4" />
                    고객사 추가
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CustomersTable
                  customers={customers}
                  searchQuery={customerSearchQuery}
                  onSearchChange={setCustomerSearchQuery}
                  onEdit={handleEditCustomer}
                  onDelete={handleDeleteCustomer}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Invoices Tab */}
          <TabsContent value="invoices" className="space-y-4">
            <TaxInvoicesTab
              invoices={taxInvoices}
              customers={customers}
              loading={loading}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onRefresh={fetchAllData}
              onConnectInvoice={handleConnectInvoice}
              onAdd={handleAddInvoice}
              onEdit={handleEditInvoice}
              onDelete={handleDeleteInvoice}
            />
          </TabsContent>

          {/* Bank Deposits Tab */}
          <TabsContent value="deposits" className="space-y-4">
            <BankDepositsTab
              deposits={bankDeposits}
              customers={customers}
              loading={loading}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onRefresh={fetchAllData}
              onConnectDeposit={handleConnectDeposit}
              onClassifyDeposit={handleClassifyDeposit}
              onAdd={handleAddDeposit}
              onEdit={handleEditDeposit}
              onDelete={handleDeleteDeposit}
            />
          </TabsContent>

          {/* Relationships Tab */}
          <TabsContent value="other-deposits" className="space-y-4">
            <OtherDepositsTab
              otherDeposits={otherDeposits}
              onAdd={handleAddOtherDeposit}
              onEdit={handleEditOtherDeposit}
              onDelete={handleDeleteOtherDeposit}
            />
          </TabsContent>
        </Tabs>

        {/* Customer Modal */}
        <CustomerModal
          open={isCustomerModalOpen}
          onOpenChange={setIsCustomerModalOpen}
          customer={editingCustomer}
          onSave={handleSaveCustomer}
        />

        {/* Tax Invoice Modal */}
        <TaxInvoiceModal
          open={isInvoiceModalOpen}
          onOpenChange={setIsInvoiceModalOpen}
          invoice={editingInvoice}
          onSave={handleSaveInvoice}
        />

        {/* Bank Deposit Modal */}
        <BankDepositModal
          open={isDepositModalOpen}
          onOpenChange={setIsDepositModalOpen}
          deposit={editingDeposit}
          onSave={handleSaveDeposit}
          customers={customers}
        />

        {/* Other Deposit Modal */}
        <OtherDepositModal
          open={isOtherDepositModalOpen}
          onOpenChange={setIsOtherDepositModalOpen}
          deposit={editingOtherDeposit}
          availableDeposits={availableDeposits}
          onSave={handleSaveOtherDeposit}
        />
      </div>
    </DashboardLayout>
  )
}