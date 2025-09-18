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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DepositClassificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'internal' | 'external'
  depositName: string | null
  onSave: (classification: {
    type: 'internal' | 'external'
    detail: string
  }) => void
}

export function DepositClassificationModal({
  open,
  onOpenChange,
  type,
  depositName,
  onSave
}: DepositClassificationModalProps) {
  const [internalType, setInternalType] = useState("사장")
  const [detail, setDetail] = useState("")

  useEffect(() => {
    // Reset form when modal opens
    if (open) {
      setInternalType("사장")
      setDetail("")
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (type === 'internal') {
      onSave({
        type: 'internal',
        detail: `${internalType}${detail ? `: ${detail}` : ''}`
      })
    } else {
      onSave({
        type: 'external',
        detail: detail || '기타'
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === 'internal' ? '내부 경영으로 분류' : '외부 기타로 분류'}
          </DialogTitle>
          <DialogDescription>
            입금내역: {depositName || '-'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            {type === 'internal' ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="internal-type">입금자 구분</Label>
                  <Select value={internalType} onValueChange={setInternalType}>
                    <SelectTrigger id="internal-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="사장">사장</SelectItem>
                      <SelectItem value="직원">직원</SelectItem>
                      <SelectItem value="기타">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="detail">추가 메모 (선택사항)</Label>
                  <Textarea
                    id="detail"
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder="예: 운영자금 충당, 급여 선지급 등"
                    rows={3}
                  />
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="detail">사유</Label>
                <Textarea
                  id="detail"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="기타 입금 사유를 입력하세요"
                  rows={4}
                  required
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit">
              분류
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}