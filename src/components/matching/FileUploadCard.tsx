"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, DollarSign, Upload, Loader2, CheckCircle } from "lucide-react"

interface FileUploadCardProps {
  title: string
  icon: string
  description: string
  file: File | null
  onFileSelect: (file: File) => void
  onUpload: () => void
  uploading: boolean
  acceptedFileTypes?: Record<string, string[]>
}

export function FileUploadCard({
  title,
  icon,
  description,
  file,
  onFileSelect,
  onUpload,
  uploading,
  acceptedFileTypes = {
    'text/csv': ['.csv'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
  }
}: FileUploadCardProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0])
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    multiple: false
  })

  const getIcon = () => {
    if (icon === '📊') {
      return <FileText className="mx-auto h-10 w-10 text-gray-400 mb-2" />
    } else {
      return <DollarSign className="mx-auto h-10 w-10 text-gray-400 mb-2" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{icon} {title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="space-y-1">
              <CheckCircle className="mx-auto h-6 w-6 text-green-500" />
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          ) : (
            <div>
              {getIcon()}
              <p className="text-sm text-muted-foreground">
                파일을 드래그하거나 클릭하여 선택
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={onUpload}
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              업로드 중...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              업로드
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}