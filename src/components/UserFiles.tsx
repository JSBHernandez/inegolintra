'use client'

import { useState, useEffect } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { uploadUserFileFormSchema, UploadUserFileFormData } from '@/lib/validations'
import { UserFile, AuthUser } from '@/types'

interface UserFilesProps {
  user: AuthUser  // The user whose files we're viewing
  currentUser?: AuthUser  // The currently authenticated user (optional, will be fetched if not provided)
}

export default function UserFiles({ user, currentUser }: UserFilesProps) {
  const [files, setFiles] = useState<UserFile[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [uploadingFile, setUploadingFile] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [authUser, setAuthUser] = useState<AuthUser | null>(currentUser || null)

  const uploadForm = useForm<UploadUserFileFormData>({
    resolver: zodResolver(uploadUserFileFormSchema),
    defaultValues: {
      fileName: '',
      fileType: '',
      fileSize: 0,
      description: ''
    }
  })

  useEffect(() => {
    // Fetch current user if not provided
    if (!authUser) {
      fetchCurrentUser()
    } else {
      // If authUser is already available, fetch files immediately
      fetchFiles()
    }
  }, [])

  // Fetch files when authUser becomes available
  useEffect(() => {
    if (authUser) {
      fetchFiles()
    }
  }, [authUser])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/me')
      const result = await response.json()
      if (result.success) {
        setAuthUser(result.user)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const fetchFiles = async () => {
    // Don't fetch if authUser is not available yet
    if (!authUser) {
      console.log('Skipping fetchFiles - authUser not available yet')
      return
    }

    try {
      // If we're viewing a specific user from User Management, pass their userId
      const url = user.id && authUser.role === 'ADMIN' && authUser.id !== user.id 
        ? `/api/user-files?userId=${user.id}`
        : '/api/user-files'
      
      console.log('Fetching files for:', { 
        targetUserId: user.id, 
        adminId: authUser.id, 
        url,
        context: user.id && authUser.role === 'ADMIN' && authUser.id !== user.id ? 'User Management' : 'My Profile'
      })
      
      const response = await fetch(url)
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
    console.log('File selected:', file ? file.name : 'No file')
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

    // Validate file size (2MB limit for deployment compatibility)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      setSubmitMessage('File size must be less than 2MB for deployment compatibility')
      return
    }

    // Auto-populate form fields for validation
    uploadForm.setValue('fileName', file.name)
    uploadForm.setValue('fileType', file.type)
    uploadForm.setValue('fileSize', file.size)
    
    setSelectedFile(file)
    console.log('File set in state:', file.name)
    setSubmitMessage('File selected successfully! Please add a description and save.')
  }

  const handleSubmitFile: SubmitHandler<UploadUserFileFormData> = async (data) => {
    console.log('handleSubmitFile called', { selectedFile: !!selectedFile, data })
    console.log('Context:', { authUser: authUser?.id, targetUser: user.id, isAdmin: authUser?.role === 'ADMIN' })
    
    if (selectedFile && authUser) {
      console.log('Starting upload for file:', selectedFile.name)
      setUploadingFile(true)
      
      try {
        // Determine if we're in User Management context (admin uploading for another user)
        const isUserManagement = authUser.role === 'ADMIN' && authUser.id !== user.id
        
        if (isUserManagement) {
          // Admin uploading for another user - use /api/user-files POST with JSON
          console.log('Using User Management upload (admin for another user)')
          
          // Convert file to base64
          const fileBuffer = await selectedFile.arrayBuffer()
          const base64File = Buffer.from(fileBuffer).toString('base64')
          const dataUrl = `data:${selectedFile.type};base64,${base64File}`
          
          const payload = {
            fileName: selectedFile.name,
            fileUrl: dataUrl,
            fileType: selectedFile.type,
            fileSize: selectedFile.size,
            description: data.description || 'File uploaded by administrator',
            userId: user.id  // Target user
          }
          
          console.log('Making request to /api/user-files with payload for user:', user.id)
          console.log('Full payload being sent:', JSON.stringify(payload, null, 2))
          
          const response = await fetch('/api/user-files', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          })
          
          const result = await response.json()
          console.log('User Management upload result:', result)
          
          if (result.success) {
            console.log('Upload successful, closing modal')
            setSubmitMessage('File uploaded and assigned to user successfully!')
            uploadForm.reset()
            setSelectedFile(null)
            setShowUploadForm(false)
            fetchFiles()
          } else {
            setSubmitMessage(`Error: ${result.error}`)
          }
          
        } else {
          // Regular user uploading for themselves - use /api/user-files/upload with FormData
          console.log('Using personal upload (user for themselves)')
          
          const formData = new FormData()
          formData.append('file', selectedFile)
          if (data.description) {
            formData.append('description', data.description)
          }

          console.log('Making request to /api/user-files/upload')
          const response = await fetch('/api/user-files/upload', {
            method: 'POST',
            body: formData,
          })

          console.log('Upload response status:', response.status)
          const result = await response.json()
          console.log('Upload result:', result)

          if (result.success) {
            console.log('Upload successful, closing modal')
            setSubmitMessage('File uploaded and saved successfully!')
            uploadForm.reset()
            setSelectedFile(null)
            setShowUploadForm(false)
            fetchFiles()
          } else {
            setSubmitMessage(`Error uploading file: ${result.error}`)
          }
        }
      } catch (error) {
        console.error('Upload error:', error)
        setSubmitMessage('Connection error while uploading file')
      } finally {
        setUploadingFile(false)
      }
    } else {
      // If no file selected, show error
      console.log('No file selected')
      setSubmitMessage('Please select a file first.')
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
            onClick={() => {
              setShowUploadForm(true)
              setSelectedFile(null)
              setSubmitMessage('')
              uploadForm.reset()
            }}
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
            Recommended format: PDF. Supported: JPG, PNG, PDF, Word, Excel (Max 2MB - deployment optimized)
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
                    download={file.fileName || 'download'}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
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
                onClick={() => {
                  setShowUploadForm(false)
                  setSelectedFile(null)
                  setSubmitMessage('')
                  uploadForm.reset()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                console.log('🔥 FORM SUBMIT EVENT', e)
                console.log('Form state:', uploadForm.formState)
                const submitHandler = uploadForm.handleSubmit(
                  handleSubmitFile,
                  (errors) => {
                    console.log('🚨 FORM VALIDATION ERRORS:', errors)
                    console.log('🚨 DETAILED ERRORS:', JSON.stringify(errors, null, 2))
                  }
                )
                submitHandler(e)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select File
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="hidden"
                  id="user-file-upload"
                />
                <label 
                  htmlFor="user-file-upload"
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50 w-full"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Choose File
                </label>
                
                {/* Show selected file name */}
                {selectedFile && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-blue-800 font-medium">{selectedFile.name}</span>
                      <span className="text-xs text-blue-600 ml-2">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-1">
                  Supported: JPG, PNG, PDF, Word, Excel (Max 2MB - deployment optimized) - <strong>PDF is recommended</strong>
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
                  disabled={uploadingFile || !selectedFile}
                  onClick={(_e) => {
                    console.log('🔥 BUTTON CLICKED - direct onClick handler')
                    console.log('Form errors:', uploadForm.formState.errors)
                    console.log('Form isValid:', uploadForm.formState.isValid)
                    console.log('Form values:', uploadForm.getValues())
                    console.log('Selected file:', selectedFile)
                    // Trigger validation manually to see what's failing
                    uploadForm.trigger().then(isValid => {
                      console.log('Manual validation result:', isValid)
                    })
                  }}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  Save File
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadForm(false)
                    setSelectedFile(null)
                    setSubmitMessage('')
                    uploadForm.reset()
                  }}
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