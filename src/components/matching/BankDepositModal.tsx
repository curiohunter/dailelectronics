"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Customer {
  id: string
  company_name: string
  representative_name?: string | null
  alias_names?: string[] | null
}

interface BankDeposit {
  id: string
  transaction_date: string
  transaction_time: string | null
  deposit_name: string | null
  deposit_amount: number
  branch_name: string | null
  relatedCustomer?: Customer | null
  [key: string]: any
}

interface BankDepositModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deposit: BankDeposit | null
  onSave: (data: Partial<BankDeposit> & { customer_id?: string | null }) => void
  customers: Customer[]
}

export function BankDepositModal({
  open,
  onOpenChange,
  deposit,
  onSave,
  customers
}: BankDepositModalProps) {
  const [formData, setFormData] = useState({
    transaction_date: "",
    transaction_time: "",
    deposit_name: "",
    deposit_amount: 0,
    branch_name: "",
    customer_id: null as string | null
  })
  const [openPopover, setOpenPopover] = useState(false)
  const [customerSearchQuery, setCustomerSearchQuery] = useState("")

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

  useEffect(() => {
    if (deposit) {
      setFormData({
        transaction_date: deposit.transaction_date || "",
        transaction_time: deposit.transaction_time || "",
        deposit_name: deposit.deposit_name || "",
        deposit_amount: deposit.deposit_amount || 0,
        branch_name: deposit.branch_name || "",
        customer_id: deposit.relatedCustomer?.id || null
      })
    } else {
      setFormData({
        transaction_date: new Date().toISOString().split('T')[0],
        transaction_time: "",
        deposit_name: "",
        deposit_amount: 0,
        branch_name: "",
        customer_id: null
      })
    }
  }, [deposit])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {deposit ? "입금내역 수정" : "입금내역 추가"}
          </DialogTitle>
          <DialogDescription>
            입금내역 정보를 입력하세요.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="transaction_date">거래일</Label>
              <Input
                id="transaction_date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="transaction_time">거래시간</Label>
              <Input
                id="transaction_time"
                type="time"
                value={formData.transaction_time}
                onChange={(e) => setFormData(prev => ({ ...prev, transaction_time: e.target.value }))}
                placeholder="HH:MM"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deposit_name">입금자명</Label>
              <Input
                id="deposit_name"
                value={formData.deposit_name}
                onChange={(e) => setFormData(prev => ({ ...prev, deposit_name: e.target.value }))}
                placeholder="입금자명 입력"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deposit_amount">입금액</Label>
              <Input
                id="deposit_amount"
                type="number"
                value={formData.deposit_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, deposit_amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="branch_name">지점명</Label>
              <Input
                id="branch_name"
                value={formData.branch_name}
                onChange={(e) => setFormData(prev => ({ ...prev, branch_name: e.target.value }))}
                placeholder="지점명 입력 (선택사항)"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customer">연결업체</Label>
              <Popover open={openPopover} onOpenChange={setOpenPopover} modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openPopover}
                    className="w-full justify-between"
                  >
                    {formData.customer_id
                      ? (() => {
                          const selectedCustomer = customers.find((customer) => customer.id === formData.customer_id)
                          if (!selectedCustomer) return "연결업체 선택 (선택사항)"
                          return selectedCustomer.representative_name
                            ? `${selectedCustomer.company_name} (${selectedCustomer.representative_name})`
                            : selectedCustomer.company_name
                        })()
                      : "연결업체 선택 (선택사항)"}
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
                        {formData.customer_id && (
                          <CommandItem
                            value=""
                            onSelect={() => {
                              setFormData(prev => ({ ...prev, customer_id: null }))
                              setOpenPopover(false)
                            }}
                            className="cursor-pointer"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                            }}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, customer_id: null }))
                              setOpenPopover(false)
                            }}
                          >
                            <Check className="mr-2 h-4 w-4 opacity-0" />
                            연결 해제
                          </CommandItem>
                        )}
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
                                setFormData(prev => ({ ...prev, customer_id: customer.id }))
                                setOpenPopover(false)
                              }}
                              className="cursor-pointer"
                              onMouseDown={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, customer_id: customer.id }))
                                setOpenPopover(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.customer_id === customer.id ? "opacity-100" : "opacity-0"
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit">
              {deposit ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}