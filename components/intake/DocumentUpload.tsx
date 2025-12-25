'use client'

import { useState, useCallback } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, FileText, FileType, Trash2, Loader2, X, CheckCircle2, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

// Supported file types
const SUPPORTED_TYPES = {
  'application/pdf': { ext: 'pdf', icon: FileType, label: 'PDF' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', icon: FileText, label: 'DOCX' },
  'application/msword': { ext: 'doc', icon: FileText, label: 'DOC' },
  'text/plain': { ext: 'txt', icon: FileText, label: 'TXT' },
  'text/csv': { ext: 'csv', icon: FileText, label: 'CSV' },
  'application/rtf': { ext: 'rtf', icon: FileText, label: 'RTF' },
  'application/vnd.oasis.opendocument.text': { ext: 'odt', icon: FileText, label: 'ODT' },
}

const ACCEPTED_TYPES = Object.keys(SUPPORTED_TYPES).join(',')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

interface UploadedFile {
  id?: Id<"documents">
  name: string
  size: number
  type: string
  status: 'uploading' | 'completed' | 'error'
  storageId?: Id<"_storage">
  downloadUrl?: string | null
  error?: string
}

interface DocumentUploadProps {
  intakeId?: Id<"intake">
  onFilesChange?: (files: UploadedFile[]) => void
  disabled?: boolean
}

export function DocumentUpload({ intakeId, onFilesChange, disabled }: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const generateUploadUrl = useMutation(api.documents.generateUploadUrl)
  const createDocument = useMutation(api.documents.createForIntake)
  const removeDocument = useMutation(api.documents.remove)

  const updateFiles = useCallback((newFiles: UploadedFile[]) => {
    setFiles(newFiles)
    onFilesChange?.(newFiles)
  }, [onFilesChange])

  const uploadFile = async (file: File) => {
    // Validate file type
    if (!SUPPORTED_TYPES[file.type as keyof typeof SUPPORTED_TYPES]) {
      return {
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'error' as const,
        error: 'File type not supported',
      }
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'error' as const,
        error: 'File size exceeds 10MB limit',
      }
    }

    // Create placeholder entry
    const fileEntry: UploadedFile = {
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
    }

    try {
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl()

      // Upload file to Convex storage
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const { storageId } = await response.json()

      // If we have an intake ID, create the document record
      let documentId: Id<"documents"> | undefined
      if (intakeId) {
        const fileTypeInfo = SUPPORTED_TYPES[file.type as keyof typeof SUPPORTED_TYPES]
        documentId = await createDocument({
          intakeId,
          name: file.name,
          type: fileTypeInfo?.ext || 'unknown',
          mimeType: file.type,
          size: file.size,
          storageId: storageId as Id<"_storage">,
        })
      }

      return {
        ...fileEntry,
        id: documentId,
        storageId: storageId as Id<"_storage">,
        status: 'completed' as const,
      }
    } catch (error) {
      console.error('Upload error:', error)
      return {
        ...fileEntry,
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return

    const newFileEntries: UploadedFile[] = Array.from(fileList).map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
    }))

    // Add uploading placeholders
    updateFiles([...files, ...newFileEntries])

    // Upload all files
    const uploadPromises = Array.from(fileList).map(uploadFile)
    const results = await Promise.all(uploadPromises)

    // Update with results
    updateFiles([...files, ...results])
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (!disabled) {
      handleFiles(e.dataTransfer.files)
    }
  }, [disabled, files])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleRemove = async (index: number) => {
    const file = files[index]

    // If document was saved to database, remove it
    if (file.id) {
      try {
        await removeDocument({ id: file.id })
      } catch (error) {
        console.error('Failed to remove document:', error)
      }
    }

    const newFiles = files.filter((_, i) => i !== index)
    updateFiles(newFiles)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (mimeType: string) => {
    const typeInfo = SUPPORTED_TYPES[mimeType as keyof typeof SUPPORTED_TYPES]
    const IconComponent = typeInfo?.icon || FileText
    return <IconComponent className="h-5 w-5 text-gray-500" />
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card
        className={cn(
          'border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
          isDragging && 'border-blue-500 bg-blue-50',
          disabled && 'opacity-50 cursor-not-allowed',
          !isDragging && !disabled && 'hover:border-gray-400'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (!disabled) {
            document.getElementById('file-upload')?.click()
          }
        }}
      >
        <input
          id="file-upload"
          type="file"
          multiple
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-2">
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center',
            isDragging ? 'bg-blue-100' : 'bg-gray-100'
          )}>
            <Upload className={cn(
              'h-6 w-6',
              isDragging ? 'text-blue-500' : 'text-gray-500'
            )} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, DOCX, DOC, TXT, CSV, RTF, ODT (max 10MB each)
            </p>
          </div>
        </div>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border',
                file.status === 'error' && 'border-red-200 bg-red-50',
                file.status === 'completed' && 'border-green-200 bg-green-50',
                file.status === 'uploading' && 'border-blue-200 bg-blue-50'
              )}
            >
              {/* File Icon */}
              {getFileIcon(file.type)}

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                  {file.error && (
                    <span className="text-red-500 ml-2">{file.error}</span>
                  )}
                </p>
              </div>

              {/* Status/Actions */}
              <div className="flex items-center gap-2">
                {file.status === 'uploading' && (
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                )}
                {file.status === 'completed' && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {file.status === 'error' && (
                  <X className="h-4 w-4 text-red-500" />
                )}

                {file.status === 'completed' && file.downloadUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(file.downloadUrl!, '_blank')
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(index)
                  }}
                  disabled={file.status === 'uploading'}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Simplified version for when we don't have an intake ID yet
// Files are stored temporarily and can be saved after intake is created
export function PendingDocumentUpload({
  onPendingFilesChange
}: {
  onPendingFilesChange: (files: { file: File; storageId: Id<"_storage"> }[]) => void
}) {
  const [pendingFiles, setPendingFiles] = useState<{ file: File; storageId: Id<"_storage">; status: 'uploading' | 'completed' | 'error'; localUrl?: string }[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const generateUploadUrl = useMutation(api.documents.generateUploadUrl)

  const uploadFile = async (file: File) => {
    // Validate file type
    if (!SUPPORTED_TYPES[file.type as keyof typeof SUPPORTED_TYPES]) {
      return null
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return null
    }

    try {
      const uploadUrl = await generateUploadUrl()
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!response.ok) throw new Error('Upload failed')

      const { storageId } = await response.json()
      return storageId as Id<"_storage">
    } catch (error) {
      console.error('Upload error:', error)
      return null
    }
  }

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return

    const validFiles = Array.from(fileList).filter(
      file => SUPPORTED_TYPES[file.type as keyof typeof SUPPORTED_TYPES] && file.size <= MAX_FILE_SIZE
    )

    // Add uploading placeholders with local URLs for download
    const placeholders = validFiles.map(file => ({
      file,
      storageId: '' as Id<"_storage">,
      status: 'uploading' as const,
      localUrl: URL.createObjectURL(file),
    }))
    setPendingFiles(prev => [...prev, ...placeholders])

    // Upload files
    const results = await Promise.all(
      validFiles.map(async (file, index) => {
        const storageId = await uploadFile(file)
        return { file, storageId, index }
      })
    )

    // Update with results
    setPendingFiles(prev => {
      const updated = [...prev]
      results.forEach(({ storageId, index }) => {
        const actualIndex = prev.length - validFiles.length + index
        if (storageId) {
          updated[actualIndex] = {
            ...updated[actualIndex],
            storageId,
            status: 'completed',
          }
        } else {
          updated[actualIndex] = {
            ...updated[actualIndex],
            status: 'error',
          }
        }
      })

      // Notify parent of completed uploads
      const completedFiles = updated
        .filter(f => f.status === 'completed' && f.storageId)
        .map(f => ({ file: f.file, storageId: f.storageId }))
      onPendingFilesChange(completedFiles)

      return updated
    })
  }

  const handleRemove = (index: number) => {
    setPendingFiles(prev => {
      const updated = prev.filter((_, i) => i !== index)
      const completedFiles = updated
        .filter(f => f.status === 'completed' && f.storageId)
        .map(f => ({ file: f.file, storageId: f.storageId }))
      onPendingFilesChange(completedFiles)
      return updated
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (mimeType: string) => {
    const typeInfo = SUPPORTED_TYPES[mimeType as keyof typeof SUPPORTED_TYPES]
    const IconComponent = typeInfo?.icon || FileText
    return <IconComponent className="h-5 w-5 text-gray-500" />
  }

  return (
    <div className="space-y-4">
      <Card
        className={cn(
          'border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
          isDragging && 'border-blue-500 bg-blue-50',
          'hover:border-gray-400'
        )}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setIsDragging(false)
        }}
        onClick={() => document.getElementById('pending-file-upload')?.click()}
      >
        <input
          id="pending-file-upload"
          type="file"
          multiple
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center gap-2">
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center',
            isDragging ? 'bg-blue-100' : 'bg-gray-100'
          )}>
            <Upload className={cn(
              'h-6 w-6',
              isDragging ? 'text-blue-500' : 'text-gray-500'
            )} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, DOCX, DOC, TXT, CSV, RTF, ODT (max 10MB each)
            </p>
          </div>
        </div>
      </Card>

      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          {pendingFiles.map((item, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border',
                item.status === 'error' && 'border-red-200 bg-red-50',
                item.status === 'completed' && 'border-green-200 bg-green-50',
                item.status === 'uploading' && 'border-blue-200 bg-blue-50'
              )}
            >
              {getFileIcon(item.file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(item.file.size)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {item.status === 'uploading' && (
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                )}
                {item.status === 'completed' && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {item.status === 'error' && (
                  <X className="h-4 w-4 text-red-500" />
                )}

                {item.localUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500"
                    onClick={(e) => {
                      e.stopPropagation()
                      const link = document.createElement('a')
                      link.href = item.localUrl!
                      link.download = item.file.name
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(index)
                  }}
                  disabled={item.status === 'uploading'}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Component to display documents with download URLs (for viewing existing documents)
interface DocumentWithUrl {
  _id: Id<"documents">
  name: string
  type?: string
  mimeType?: string
  size?: number
  downloadUrl?: string | null
}

export function DocumentList({ documents }: { documents: DocumentWithUrl[] }) {
  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return 'Unknown size'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (mimeType: string | undefined) => {
    if (mimeType && SUPPORTED_TYPES[mimeType as keyof typeof SUPPORTED_TYPES]) {
      const IconComponent = SUPPORTED_TYPES[mimeType as keyof typeof SUPPORTED_TYPES].icon
      return <IconComponent className="h-5 w-5 text-gray-500" />
    }
    return <FileText className="h-5 w-5 text-gray-500" />
  }

  if (documents.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">No documents uploaded</div>
    )
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc._id}
          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50"
        >
          {getFileIcon(doc.mimeType)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {doc.name}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(doc.size)}
            </p>
          </div>
          {doc.downloadUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500"
              onClick={() => window.open(doc.downloadUrl!, '_blank')}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
