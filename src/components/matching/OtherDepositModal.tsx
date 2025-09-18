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

interface BankDeposit {
  id: string
  transaction_date: string
  transaction_time: string | null
  deposit_name: string | null
  deposit_amount: number
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

interface OtherDepositModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deposit: OtherDeposit | null
  availableDeposits: BankDeposit[] // 미분류 입금 목록
  onSave: (data: {
    bank_deposit_id: string
    classification_type: 'internal' | 'external'
    classification_detail: string
  }) => void
}

export function OtherDepositModal({
  open,
  onOpenChange,
  deposit,
  availableDeposits,
  onSave
}: OtherDepositModalProps) {
  const [selectedDepositId, setSelectedDepositId] = useState("")
  const [classificationType, setClassificationType] = useState<'internal' | 'external'>('internal')
  const [internalType, setInternalType] = useState("사장")
  const [detail, setDetail] = useState("")
  const [depositOpen, setDepositOpen] = useState(false)

  useEffect(() => {
    if (deposit) {
      // 수정 모드
      setSelectedDepositId(deposit.bank_deposit_id)
      setClassificationType(deposit.classification_type)

      // classification_detail 파싱
      if (deposit.classification_type === 'internal' && deposit.classification_detail) {
        const parts = deposit.classification_detail.split(': ')
        if (parts.length > 0) {
          setInternalType(parts[0])
          setDetail(parts[1] || '')
        }
      } else {
        setDetail(deposit.classification_detail || '')
      }
    } else {
      // 추가 모드 - 초기화
      setSelectedDepositId("")
      setClassificationType('internal')
      setInternalType("사장")
      setDetail("")
    }
  }, [deposit, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDepositId && !deposit) {
      alert("입금내역을 선택해주세요.")
      return
    }

    let classificationDetail = ""
    if (classificationType === 'internal') {
      classificationDetail = `${internalType}${detail ? `: ${detail}` : ''}`
    } else {
      if (!detail) {
        alert("외부 기타 사유를 입력해주세요.")
        return
      }
      classificationDetail = detail
    }

    onSave({
      bank_deposit_id: deposit ? deposit.bank_deposit_id : selectedDepositId,
      classification_type: classificationType,
      classification_detail: classificationDetail
    })

    onOpenChange(false)
  }

  const selectedDeposit = deposit?.deposit || availableDeposits.find(d => d.id === selectedDepositId)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR')
  }

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ko-KR')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{deposit ? '기타 입금 수정' : '기타 입금 추가'}</DialogTitle>
          <DialogDescription>
            입금내역을 내부 경영 또는 외부 기타로 분류합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            {/* 입금내역 선택 (추가 모드일 때만) */}
            {!deposit && (
              <div className="grid gap-2">
                <Label htmlFor="deposit">입금내역 선택 *</Label>
                <Popover open={depositOpen} onOpenChange={setDepositOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={depositOpen}
                      className="justify-between"
                    >
                      {selectedDeposit
                        ? `${formatDate(selectedDeposit.transaction_date)} - ${selectedDeposit.deposit_name} (${formatAmount(selectedDeposit.deposit_amount)}원)`
                        : "입금내역을 선택하세요..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[450px] p-0">
                    <Command>
                      <CommandInput placeholder="입금명 검색..." />
                      <CommandList>
                        <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                        <CommandGroup>
                          {availableDeposits.map((depositItem) => (
                            <CommandItem
                              key={depositItem.id}
                              value={`${depositItem.deposit_name} ${depositItem.deposit_amount}`}
                              onSelect={() => {
                                setSelectedDepositId(depositItem.id)
                                setDepositOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedDepositId === depositItem.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <span>{formatDate(depositItem.transaction_date)}</span>
                                  <span className="font-medium">{depositItem.deposit_name}</span>
                                  <span className="tabular-nums">{formatAmount(depositItem.deposit_amount)}원</span>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* 수정 모드일 때 입금 정보 표시 */}
            {deposit && selectedDeposit && (
              <div className="grid gap-2 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <span className="font-medium">입금일자:</span> {formatDate(selectedDeposit.transaction_date)}
                </div>
                <div className="text-sm">
                  <span className="font-medium">입금명:</span> {selectedDeposit.deposit_name}
                </div>
                <div className="text-sm">
                  <span className="font-medium">입금액:</span> {formatAmount(selectedDeposit.deposit_amount)}원
                </div>
              </div>
            )}

            {/* 분류 유형 선택 */}
            <div className="grid gap-2">
              <Label htmlFor="classification-type">분류 유형 *</Label>
              <Select value={classificationType} onValueChange={(value: 'internal' | 'external') => setClassificationType(value)}>
                <SelectTrigger id="classification-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">내부 경영</SelectItem>
                  <SelectItem value="external">외부 기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 내부 경영 상세 */}
            {classificationType === 'internal' && (
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
            )}

            {/* 외부 기타 상세 */}
            {classificationType === 'external' && (
              <div className="grid gap-2">
                <Label htmlFor="detail">사유 *</Label>
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
              {deposit ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}