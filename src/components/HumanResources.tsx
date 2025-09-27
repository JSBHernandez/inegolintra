'use client'

import { useState, useEffect } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthUser, PermissionRequest, IncidentReport } from '@/types'
import { 
  permissionRequestSchema, 
  incidentReportSchema, 
  PermissionRequestFormData, 
  IncidentReportFormData,
  permissionTypeOptions,
  incidentTypeOptions,
  priorityOptions
} from '@/lib/validations'

interface HumanResourcesProps {
  user: AuthUser
}

export default function HumanResources({ user }: HumanResourcesProps) {
  const [activeTab, setActiveTab] = useState<'permissions' | 'incidents'>('permissions')
  const [permissionRequests, setPermissionRequests] = useState<PermissionRequest[]>([])
  const [incidentReports, setIncidentReports] = useState<IncidentReport[]>([])
  const [showPermissionForm, setShowPermissionForm] = useState(false)
  const [showIncidentForm, setShowIncidentForm] = useState(false)
  const [showDecisionModal, setShowDecisionModal] = useState<{
    requestId: number
    isApproval: boolean
  } | null>(null)
  const [decisionNote, setDecisionNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitMessage, setSubmitMessage] = useState('')
  const [uploadingFile, setUploadingFile] = useState(false)

  const permissionForm = useForm<PermissionRequestFormData>({
    resolver: zodResolver(permissionRequestSchema),
  })

  const incidentForm = useForm<IncidentReportFormData>({
    resolver: zodResolver(incidentReportSchema),
    defaultValues: {
      priority: 'MEDIUM'
    }
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch permission requests
      const permissionResponse = await fetch('/api/permission-requests')
      if (permissionResponse.ok) {
        const permissionResult = await permissionResponse.json()
        if (permissionResult.success) {
          setPermissionRequests(permissionResult.data)
        }
      }

      // Fetch incident reports
      const incidentResponse = await fetch('/api/incident-reports')
      if (incidentResponse.ok) {
        const incidentResult = await incidentResponse.json()
        if (incidentResult.success) {
          setIncidentReports(incidentResult.data)
        }
      }
    } catch (error) {
      console.error('Error fetching HR data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionSubmit: SubmitHandler<PermissionRequestFormData> = async (data) => {
    try {
      const response = await fetch('/api/permission-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      if (result.success) {
        setSubmitMessage('Permission request submitted successfully!')
        permissionForm.reset()
        setShowPermissionForm(false)
        fetchData()
      } else {
        setSubmitMessage(`Error: ${result.error}`)
      }
    } catch {
      setSubmitMessage('Failed to submit permission request')
    }
  }

  const handleIncidentSubmit: SubmitHandler<IncidentReportFormData> = async (data) => {
    try {
      const response = await fetch('/api/incident-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      if (result.success) {
        setSubmitMessage('Incident report submitted successfully!')
        incidentForm.reset()
        setShowIncidentForm(false)
        fetchData()
      } else {
        setSubmitMessage(`Error: ${result.error}`)
      }
    } catch {
      setSubmitMessage('Failed to submit incident report')
    }
  }

  const handleApprovePermission = async (id: number, approved: boolean, note?: string) => {
    try {
      const response = await fetch('/api/permission-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: approved ? 'APPROVED' : 'REJECTED',
          rejectedReason: note // This will be used as admin note for both approval and rejection
        }),
      })

      const result = await response.json()
      if (result.success) {
        setSubmitMessage(`Permission request ${approved ? 'approved' : 'rejected'} successfully! ${note ? 'Email notification sent to agent.' : ''}`)
        fetchData()
        setShowDecisionModal(null)
        setDecisionNote('')
      } else {
        setSubmitMessage(`Error: ${result.error}`)
      }
    } catch {
      setSubmitMessage('Failed to update permission request')
    }
  }

  const openDecisionModal = (requestId: number, isApproval: boolean) => {
    setShowDecisionModal({ requestId, isApproval })
    setDecisionNote('')
  }

  const submitDecision = () => {
    if (showDecisionModal) {
      handleApprovePermission(
        showDecisionModal.requestId, 
        showDecisionModal.isApproval, 
        decisionNote.trim() || undefined
      )
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

    // Validate file size (2MB limit for deployment compatibility)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      setSubmitMessage('File size must be less than 2MB for deployment compatibility')
      return
    }

    setUploadingFile(true)

    try {
      const formData = new FormData()
      formData.append('photo', file) // Using same endpoint as photo upload

      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        incidentForm.setValue('imageUrl', result.photoUrl)
        setSubmitMessage('File uploaded successfully!')
      } else {
        setSubmitMessage(`Error uploading file: ${result.error}`)
      }
    } catch {
      setSubmitMessage('Connection error while uploading file')
    } finally {
      setUploadingFile(false)
    }
  }

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFileTypeIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return '📄'
      case 'doc':
      case 'docx':
        return '📝'
      case 'xls':
      case 'xlsx':
        return '📊'
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️'
      default:
        return '📎'
    }
  }

  const getFileTypeName = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return 'PDF Document'
      case 'doc':
      case 'docx':
        return 'Word Document'
      case 'xls':
      case 'xlsx':
        return 'Excel Spreadsheet'
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'Image'
      default:
        return 'File'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="px-3 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Human Resources</h2>
            <p className="mt-1 text-sm sm:text-base text-gray-600">Manage permission requests and incident reports</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => setShowPermissionForm(true)}
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm w-full sm:w-auto"
            >
              Request Permission
            </button>
            <button
              onClick={() => setShowIncidentForm(true)}
              className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors text-sm w-full sm:w-auto"
            >
              Report Incident
            </button>
          </div>
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

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'permissions'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Permission Requests ({permissionRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('incidents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'incidents'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Incident Reports ({incidentReports.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              {permissionRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No permission requests found.</p>
              ) : (
                permissionRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {request.requestType.replace('_', ' ')}
                          </h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>From:</strong> {formatDate(request.startDate)} <strong>To:</strong> {formatDate(request.endDate)}
                        </p>
                        <p className="text-sm text-gray-700">{request.reason}</p>
                        {request.user && (
                          <p className="text-xs text-gray-500 mt-2">
                            Requested by: {request.user.name} ({request.user.position})
                          </p>
                        )}
                      </div>
                      
                      {user.role === 'ADMIN' && request.status === 'PENDING' && (
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => openDecisionModal(request.id, true)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => openDecisionModal(request.id, false)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'incidents' && (
            <div className="space-y-4">
              {incidentReports.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No incident reports found.</p>
              ) : (
                incidentReports.map((incident) => (
                  <div key={incident.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{incident.title}</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(incident.priority)}`}>
                            {incident.priority}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(incident.status)}`}>
                            {incident.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Type:</strong> {incident.incidentType.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-700">{incident.description}</p>
                        {incident.imageUrl && (
                          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{getFileTypeIcon(incident.imageUrl)}</span>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {getFileTypeName(incident.imageUrl)}
                                </p>
                                <a 
                                  href={incident.imageUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                  View/Download File
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                        {incident.user && (
                          <p className="text-xs text-gray-500 mt-2">
                            Reported by: {incident.user.name} ({incident.user.position}) on {formatDate(incident.createdAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Permission Request Modal */}
      {showPermissionForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Request Permission</h3>
              <button
                onClick={() => setShowPermissionForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form onSubmit={permissionForm.handleSubmit(handlePermissionSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Request Type
                </label>
                <select
                  {...permissionForm.register('requestType')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select type</option>
                  {permissionTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {permissionForm.formState.errors.requestType && (
                  <p className="mt-1 text-sm text-red-600">{permissionForm.formState.errors.requestType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  {...permissionForm.register('startDate')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {permissionForm.formState.errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{permissionForm.formState.errors.startDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  {...permissionForm.register('endDate')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {permissionForm.formState.errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{permissionForm.formState.errors.endDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  {...permissionForm.register('reason')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Please provide a detailed reason for your request..."
                />
                {permissionForm.formState.errors.reason && (
                  <p className="mt-1 text-sm text-red-600">{permissionForm.formState.errors.reason.message}</p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowPermissionForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Incident Report Modal */}
      {showIncidentForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Report Incident</h3>
              <button
                onClick={() => setShowIncidentForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form onSubmit={incidentForm.handleSubmit(handleIncidentSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  {...incidentForm.register('title')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Brief description of the incident"
                />
                {incidentForm.formState.errors.title && (
                  <p className="mt-1 text-sm text-red-600">{incidentForm.formState.errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Incident Type
                </label>
                <select
                  {...incidentForm.register('incidentType')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select type</option>
                  {incidentTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {incidentForm.formState.errors.incidentType && (
                  <p className="mt-1 text-sm text-red-600">{incidentForm.formState.errors.incidentType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  {...incidentForm.register('priority')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {incidentForm.formState.errors.priority && (
                  <p className="mt-1 text-sm text-red-600">{incidentForm.formState.errors.priority.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...incidentForm.register('description')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Detailed description of the incident..."
                />
                {incidentForm.formState.errors.description && (
                  <p className="mt-1 text-sm text-red-600">{incidentForm.formState.errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attachment (optional)
                </label>
                <div className="space-y-3">
                  {/* URL Input */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      File URL
                    </label>
                    <input
                      type="url"
                      {...incidentForm.register('imageUrl')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="URL to file or image"
                    />
                  </div>
                  
                  {/* File Upload */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Or upload from device
                    </label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="hidden"
                      id="hr-file-upload"
                    />
                    <label 
                      htmlFor="hr-file-upload"
                      className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50 w-full"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Choose File
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: JPG, JPEG, PNG, PDF, Word, Excel (Max 2MB - deployment optimized)
                    </p>
                    
                    {uploadingFile && (
                      <div className="flex items-center mt-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                        <span className="text-sm text-gray-600">Uploading...</span>
                      </div>
                    )}
                    
                    {incidentForm.watch('imageUrl') && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800">
                          ✓ File attached: 
                          <a 
                            href={incidentForm.watch('imageUrl')} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-1 underline hover:text-green-900"
                          >
                            View file
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {incidentForm.formState.errors.imageUrl && (
                  <p className="mt-1 text-sm text-red-600">{incidentForm.formState.errors.imageUrl.message}</p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  Submit Report
                </button>
                <button
                  type="button"
                  onClick={() => setShowIncidentForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permission Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl p-4 sm:p-6 m-4 max-w-md w-full max-h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {showDecisionModal.isApproval ? '✅ Approve' : '❌ Reject'} Permission Request
              </h3>
              <button
                onClick={() => setShowDecisionModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${showDecisionModal.isApproval ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm ${showDecisionModal.isApproval ? 'text-green-800' : 'text-red-800'}`}>
                  You are about to <strong>{showDecisionModal.isApproval ? 'approve' : 'reject'}</strong> this permission request.
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  An automatic email notification will be sent to the agent with your decision.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {showDecisionModal.isApproval ? 'Admin Note (Optional)' : 'Reason for Rejection (Optional)'}
                </label>
                <textarea
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder={
                    showDecisionModal.isApproval 
                      ? "Add any additional comments or instructions..." 
                      : "Please provide a reason for rejection..."
                  }
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={submitDecision}
                  className={`flex-1 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                    showDecisionModal.isApproval
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  }`}
                >
                  {showDecisionModal.isApproval ? '✅ Approve & Send Email' : '❌ Reject & Send Email'}
                </button>
                <button
                  onClick={() => setShowDecisionModal(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
