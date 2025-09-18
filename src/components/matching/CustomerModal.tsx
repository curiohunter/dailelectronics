"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"

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

interface CustomerForm {
  company_name: string
  business_number: string
  representative_name: string
  address: string
  phone: string
  email: string
  notes: string
  alias_names: string[]
}

interface CustomerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
  onSave: (form: CustomerForm) => void
}

export function CustomerModal({
  open,
  onOpenChange,
  customer,
  onSave
}: CustomerModalProps) {
  const [form, setForm] = useState<CustomerForm>({
    company_name: "",
    business_number: "",
    representative_name: "",
    address: "",
    phone: "",
    email: "",
    notes: "",
    alias_names: []
  })
  const [newAlias, setNewAlias] = useState("")

  useEffect(() => {
    if (customer) {
      setForm({
        company_name: customer.company_name,
        business_number: customer.business_number || "",
        representative_name: customer.representative_name || "",
        address: customer.address || "",
        phone: customer.phone || "",
        email: customer.email || "",
        notes: customer.notes || "",
        alias_names: customer.alias_names || []
      })
    } else {
      setForm({
        company_name: "",
        business_number: "",
        representative_name: "",
        address: "",
        phone: "",
        email: "",
        notes: "",
        alias_names: []
      })
    }
  }, [customer])

  const handleAddAlias = () => {
    if (newAlias.trim()) {
      setForm(prev => ({
        ...prev,
        alias_names: [...prev.alias_names, newAlias.trim()]
      }))
      setNewAlias("")
    }
  }

  const handleRemoveAlias = (index: number) => {
    setForm(prev => ({
      ...prev,
      alias_names: prev.alias_names.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = () => {
    onSave(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {customer ? '고객사 정보 편집' : '새 고객사 등록'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="company_name">회사명*</Label>
            <Input
              id="company_name"
              value={form.company_name}
              onChange={(e) => setForm({...form, company_name: e.target.value})}
              placeholder="예: 다일전기"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="business_number">사업자번호</Label>
            <Input
              id="business_number"
              value={form.business_number}
              onChange={(e) => setForm({...form, business_number: e.target.value})}
              placeholder="예: 123-45-67890"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="representative_name">대표자명</Label>
            <Input
              id="representative_name"
              value={form.representative_name}
              onChange={(e) => setForm({...form, representative_name: e.target.value})}
              placeholder="예: 홍길동"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="phone">전화번호</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({...form, phone: e.target.value})}
              placeholder="예: 02-1234-5678"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              placeholder="예: contact@company.com"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="address">주소</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm({...form, address: e.target.value})}
              placeholder="예: 서울시 강남구 테헤란로 123"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="notes">메모</Label>
            <textarea
              id="notes"
              className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={form.notes}
              onChange={(e) => setForm({...form, notes: e.target.value})}
              placeholder="거래처 관련 메모를 입력하세요..."
            />
          </div>
          
          <div className="grid gap-2">
            <Label>별칭 (입금자명 매칭용)</Label>
            <div className="flex gap-2">
              <Input
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                placeholder="별칭 추가..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddAlias()
                  }
                }}
              />
              <Button type="button" onClick={handleAddAlias} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {form.alias_names.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.alias_names.map((alias, idx) => (
                  <Badge key={idx} variant="secondary" className="pr-1">
                    {alias}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1 hover:bg-transparent"
                      onClick={() => handleRemoveAlias(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button type="button" onClick={handleSubmit}>
            {customer ? '저장' : '등록'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}