'use client'

import { useState, useEffect } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { uploadUserFileSchema, UploadUserFileFormData } from '@/lib/validations'
import { UserFile, AuthUser } from '@/types'

interface UserFilesProps {
  user: AuthUser
}

export default function UserFiles({ user }: UserFilesProps) {
  const [files, setFiles] = useState<UserFile[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [uploadingFile, setUploadingFile] = useState(false)

  const uploadForm = useForm<UploadUserFileFormData>({
    resolver: zodResolver(uploadUserFileSchema),
    defaultValues: {
      fileName: '',
      fileUrl: '',
      fileType: '',
      fileSize: 0,
      description: ''
    }
  })

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/user-files')
      const result = await response.json()

      if (result.success) {
        setFiles(result.data)
      } else {
        setSubmitMessage(`Error: ${result.error}`)
      }
    } catch {
      setSubmitMessage('Failed to fetch files')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ]

    if (!allowedTypes.includes(file.type)) {
      setSubmitMessage('Please select a valid file type (JPG, JPEG, PNG, PDF, Word, Excel)')
      return
    }

    // Validate file size (15MB limit for user files)
    const maxSize = 15 * 1024 * 1024 // 15MB
    if (file.size > maxSize) {
      setSubmitMessage('File size must be less than 15MB')
      return
    }

    setUploadingFile(true)

    try {
      const formData = new FormData()
      formData.append('photo', file)

      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        uploadForm.setValue('fileName', file.name)
        uploadForm.setValue('fileUrl', result.photoUrl)
        uploadForm.setValue('fileType', file.type)
        uploadForm.setValue('fileSize', file.size)
        setSubmitMessage('File uploaded successfully! Please add a description and save.')
      } else {
        setSubmitMessage(`Error uploading file: ${result.error}`)
      }
    } catch {
      setSubmitMessage('Connection error while uploading file')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSubmitFile: SubmitHandler<UploadUserFileFormData> = async (data) => {
    try {
      const response = await fetch('/api/user-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        setSubmitMessage('File saved successfully!')
        uploadForm.reset()
        setShowUploadForm(false)
        fetchFiles()
      } else {
        setSubmitMessage(`Error: ${result.error}`)
      }
    } catch {
      setSubmitMessage('Failed to save file')
    }
  }

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/user-files?id=${fileId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setSubmitMessage('File deleted successfully!')
        fetchFiles()
      } else {
        setSubmitMessage(`Error: ${result.error}`)
      }
    } catch {
      setSubmitMessage('Failed to delete file')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊'
    if (fileType.includes('image')) return '🖼️'
    return '📎'
  }

  const getFileTypeName = (fileType: string) => {
    if (fileType.includes('pdf')) return 'PDF Document'
    if (fileType.includes('word') || fileType.includes('document')) return 'Word Document'
    if (fileType.includes('sheet') || fileType.includes('excel')) return 'Excel Spreadsheet'
    if (fileType.includes('image')) return 'Image'
    return 'Document'
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Files</h2>
            <p className="mt-1 text-gray-600">Manage your personal documents and files</p>
          </div>
          <button
            onClick={() => setShowUploadForm(true)}
            className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors font-medium"
          >
            + Upload File
          </button>
        </div>
      </div>

      {/* Messages */}
      {submitMessage && (
        <div className={`mb-6 p-4 rounded-md ${
          submitMessage.includes('successfully') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {submitMessage}
          <button
            onClick={() => setSubmitMessage('')}
            className="ml-4 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Files List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Your Files ({files.length})
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Recommended format: PDF. Supported: JPG, PNG, PDF, Word, Excel (Max 15MB)
          </p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {files.map((file) => (
            <div key={file.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <span className="text-2xl">{getFileTypeIcon(file.fileType)}</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">{file.fileName}</h4>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span>{getFileTypeName(file.fileType)}</span>
                      <span>•</span>
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>•</span>
                      <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                    </div>
                    {file.description && (
                      <p className="mt-2 text-sm text-gray-600">{file.description}</p>
                    )}
                    {file.uploadedBy && file.uploadedBy.id !== user.id && (
                      <p className="mt-1 text-xs text-gray-500">
                        Uploaded by: {file.uploadedBy.name}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                  >
                    View/Download
                  </a>
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {files.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg">No files uploaded yet</p>
              <p className="mt-2">Upload your first document to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl p-6 m-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Upload New File</h3>
              <button
                onClick={() => setShowUploadForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form onSubmit={uploadForm.handleSubmit(handleSubmitFile)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select File
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported: JPG, PNG, PDF, Word, Excel (Max 15MB) - <strong>PDF is recommended</strong>
                </p>
                
                {uploadingFile && (
                  <div className="flex items-center mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                    <span className="text-sm text-gray-600">Uploading...</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  {...uploadForm.register('description')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Employment contract, ID copy, etc."
                />
                {uploadForm.formState.errors.description && (
                  <p className="mt-1 text-sm text-red-600">{uploadForm.formState.errors.description.message}</p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={uploadingFile || !uploadForm.watch('fileUrl')}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  Save File
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}