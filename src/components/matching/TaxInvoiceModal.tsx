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
import { Textarea } from "@/components/ui/textarea"

interface TaxInvoice {
  id: string
  approval_number: string | null
  issue_date: string
  buyer_company_name: string | null
  total_amount: number
  supply_amount: number
  tax_amount: number
  item_name: string | null
  [key: string]: any
}

interface TaxInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: TaxInvoice | null
  onSave: (data: Partial<TaxInvoice>) => void
}

export function TaxInvoiceModal({
  open,
  onOpenChange,
  invoice,
  onSave
}: TaxInvoiceModalProps) {
  const [formData, setFormData] = useState({
    approval_number: "",
    issue_date: "",
    buyer_company_name: "",
    supply_amount: 0,
    tax_amount: 0,
    total_amount: 0,
    item_name: ""
  })

  useEffect(() => {
    if (invoice) {
      setFormData({
        approval_number: invoice.approval_number || "",
        issue_date: invoice.issue_date || "",
        buyer_company_name: invoice.buyer_company_name || "",
        supply_amount: invoice.supply_amount || 0,
        tax_amount: invoice.tax_amount || 0,
        total_amount: invoice.total_amount || 0,
        item_name: invoice.item_name || ""
      })
    } else {
      setFormData({
        approval_number: "",
        issue_date: new Date().toISOString().split('T')[0],
        buyer_company_name: "",
        supply_amount: 0,
        tax_amount: 0,
        total_amount: 0,
        item_name: ""
      })
    }
  }, [invoice])

  const handleSupplyAmountChange = (value: string) => {
    const supply = parseFloat(value) || 0
    const tax = Math.round(supply * 0.1)
    const total = supply + tax
    
    setFormData(prev => ({
      ...prev,
      supply_amount: supply,
      tax_amount: tax,
      total_amount: total
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {invoice ? "세금계산서 수정" : "세금계산서 추가"}
          </DialogTitle>
          <DialogDescription>
            세금계산서 정보를 입력하세요.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="approval_number">승인번호</Label>
              <Input
                id="approval_number"
                value={formData.approval_number}
                onChange={(e) => setFormData(prev => ({ ...prev, approval_number: e.target.value }))}
                placeholder="승인번호 입력"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="issue_date">발행일</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="buyer_company_name">공급받는자</Label>
              <Input
                id="buyer_company_name"
                value={formData.buyer_company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, buyer_company_name: e.target.value }))}
                placeholder="회사명 입력"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="item_name">품목</Label>
              <Input
                id="item_name"
                value={formData.item_name}
                onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
                placeholder="품목명 입력"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="supply_amount">공급가액</Label>
              <Input
                id="supply_amount"
                type="number"
                value={formData.supply_amount}
                onChange={(e) => handleSupplyAmountChange(e.target.value)}
                placeholder="0"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tax_amount">세액</Label>
                <Input
                  id="tax_amount"
                  type="number"
                  value={formData.tax_amount}
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="total_amount">합계</Label>
                <Input
                  id="total_amount"
                  type="number"
                  value={formData.total_amount}
                  readOnly
                  className="bg-gray-50 font-medium"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit">
              {invoice ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}