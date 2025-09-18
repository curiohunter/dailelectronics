"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  AlertCircle,
  Upload,
  FileText,
  Loader2,
  RefreshCw
} from "lucide-react"

interface UploadStatus {
  total: number
  processed: number
  success: number
  errors: number
  duplicates: number
  message?: string
}

interface UploadSectionProps {
  title: string
  description: string
  acceptedFormats: string
  uploadEndpoint: string
  isUploading: boolean
  uploadStatus: UploadStatus | null
  lastUploadTime: string | null
  onUpload: (file: File) => void
  onReset: () => void
  onRefresh: () => void
}

export function UploadSection({
  title,
  description,
  acceptedFormats,
  uploadEndpoint,
  isUploading,
  uploadStatus,
  lastUploadTime,
  onUpload,
  onReset,
  onRefresh
}: UploadSectionProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0])
    }
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  })

  return (
    <Card className="relative overflow-hidden">
      {uploadStatus && uploadStatus.success > 0 && (
        <div className="absolute inset-0 bg-green-50/50 pointer-events-none" />
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button onClick={onRefresh} size="icon" variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-border'
          }`}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="space-y-2">
              <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">업로드 중...</p>
            </div>
          ) : uploadStatus ? (
            <div className="space-y-2">
              {uploadStatus.success > 0 ? (
                <CheckCircle className="h-10 w-10 mx-auto text-green-500" />
              ) : (
                <AlertCircle className="h-10 w-10 mx-auto text-yellow-500" />
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {uploadStatus.message || '업로드 완료'}
                </p>
                <div className="flex justify-center gap-2 text-xs">
                  <Badge variant="default">총 {uploadStatus.total}건</Badge>
                  <Badge variant="secondary">성공 {uploadStatus.success}건</Badge>
                  {uploadStatus.duplicates > 0 && (
                    <Badge variant="outline">중복 {uploadStatus.duplicates}건</Badge>
                  )}
                  {uploadStatus.errors > 0 && (
                    <Badge variant="destructive">오류 {uploadStatus.errors}건</Badge>
                  )}
                </div>
              </div>
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onReset()
                }}
                size="sm"
                variant="outline"
                className="mt-2"
              >
                다시 업로드
              </Button>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                {isDragActive
                  ? '파일을 놓으세요'
                  : '파일을 드래그하거나 클릭하여 선택'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {acceptedFormats}
              </p>
            </>
          )}
        </div>
        {lastUploadTime && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            마지막 업로드: {lastUploadTime}
          </p>
        )}
      </CardContent>
    </Card>
  )
}