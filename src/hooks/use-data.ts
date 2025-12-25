'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'

// ===== 타입 정의 =====
interface AllDataResponse {
  success: boolean
  data: {
    customers: any[]
    taxInvoices: any[]
    bankDeposits: any[]
    invoiceRelations: any[]
    depositRelations: any[]
    otherDeposits: any[]
  }
  meta: {
    duration: string
    timestamp: string
  }
}

// ===== 메인 훅: 모든 데이터 가져오기 =====
export function useAllData() {
  return useQuery<AllDataResponse>({
    queryKey: ['all-data'],
    queryFn: async () => {
      const res = await fetch('/api/matching/all-data')
      if (!res.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.')
      }
      return res.json()
    },
  })
}

// ===== 편의 훅: 특정 데이터만 필요한 경우 =====

export function useCustomers() {
  const { data, ...rest } = useAllData()
  return {
    data: data?.data?.customers ?? [],
    ...rest,
  }
}

export function useTaxInvoices() {
  const { data, ...rest } = useAllData()
  return {
    data: data?.data?.taxInvoices ?? [],
    ...rest,
  }
}

export function useBankDeposits() {
  const { data, ...rest } = useAllData()
  return {
    data: data?.data?.bankDeposits ?? [],
    ...rest,
  }
}

export function useInvoiceRelations() {
  const { data, ...rest } = useAllData()
  return {
    data: data?.data?.invoiceRelations ?? [],
    ...rest,
  }
}

export function useDepositRelations() {
  const { data, ...rest } = useAllData()
  return {
    data: data?.data?.depositRelations ?? [],
    ...rest,
  }
}

// ===== Mutation 훅: 파일 업로드 =====

export function useUploadTaxInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload/tax-invoice', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '업로드 실패')
      }

      return res.json()
    },
    onSuccess: (data) => {
      // 캐시 무효화하여 최신 데이터 다시 가져오기
      queryClient.invalidateQueries({ queryKey: ['all-data'] })
      toast({
        title: '업로드 완료',
        description: data.message || '세금계산서가 업로드되었습니다.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: '업로드 실패',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUploadBankDeposit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload/bank-deposit', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '업로드 실패')
      }

      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['all-data'] })
      toast({
        title: '업로드 완료',
        description: data.message || '입금내역이 업로드되었습니다.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: '업로드 실패',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// ===== Mutation 훅: 잔액 조정 =====

interface BalanceAdjustmentPayload {
  customers: Array<{
    customerId: string
    companyName: string
    aliasNames?: string[]
    amount: number
  }>
}

export function useBalanceAdjustment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: BalanceAdjustmentPayload) => {
      const res = await fetch('/api/balance-adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '잔액 조정 실패')
      }

      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['all-data'] })
      toast({
        title: '잔액 조정 완료',
        description: data.message,
      })
    },
    onError: (error: Error) => {
      toast({
        title: '잔액 조정 실패',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// ===== 유틸리티: 캐시 수동 무효화 =====

export function useInvalidateAllData() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: ['all-data'] })
  }
}
