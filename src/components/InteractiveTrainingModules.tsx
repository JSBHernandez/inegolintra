'use client'

import { useState, useEffect } from 'react'
import { TrainingModule, TrainingModuleContent, AuthUser, ContentType, TrainingCategory } from '@/types'

interface InteractiveTrainingModulesProps {
  user: AuthUser
}

interface ContentForm {
  title: string
  description: string
  contentType: ContentType
  url: string
  fileData: string
  fileName: string
  fileSize: number
  order: number
  isActive: boolean
}

const TRAINING_CATEGORIES: { value: TrainingCategory; label: string }[] = [
  { value: 'VISAS', label: 'Visas' },
  { value: 'IMMIGRATION_LAW', label: 'Immigration Law' },
  { value: 'CUSTOMER_SERVICE', label: 'Customer Service' },
  { value: 'TECHNOLOGY', label: 'Technology' },
  { value: 'COMPLIANCE', label: 'Compliance' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'OTHER', label: 'Other' }
]

const getCategoryLabel = (category: TrainingCategory | null | undefined): string => {
  if (!category) return ''
  return TRAINING_CATEGORIES.find(c => c.value === category)?.label || category
}

const getYouTubeEmbedUrl = (url: string): string => {
  if (!url) return ''
  
  // Extract video ID from various YouTube URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = url.match(regExp)
  
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`
  }
  
  return url // Return original if not a YouTube URL
}

export default function InteractiveTrainingModules({ user }: InteractiveTrainingModulesProps) {
  const [modules, setModules] = useState<TrainingModule[]>([])
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null)
  const [moduleContent, setModuleContent] = useState<TrainingModuleContent[]>([])
  const [loading, setLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  
  // View state - controls which view to show
  const [currentView, setCurrentView] = useState<'modules' | 'content'>('modules')
  
  // Module management states
  const [showCreateModule, setShowCreateModule] = useState(false)
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null)
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    category: 'VISAS' as TrainingCategory,
    content: '',
    isActive: true,
    order: 0
  })

  // Content management states
  const [showAddContent, setShowAddContent] = useState(false)
  const [editingContent, setEditingContent] = useState<TrainingModuleContent | null>(null)
  const [contentForm, setContentForm] = useState<ContentForm>({
    title: '',
    description: '',
    contentType: 'TEXT',
    url: '',
    fileData: '',
    fileName: '',
    fileSize: 0,
    order: 0,
    isActive: true
  })

  const [_selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    fetchModules()
  }, [])

  // Helper function to get next order number for content
  const getNextContentOrder = () => {
    if (!moduleContent || moduleContent.length === 0) return 1
    const maxOrder = Math.max(...moduleContent.map(content => content.order || 0))
    return maxOrder + 1
  }

  // Update order when adding new content
  const handleShowAddContent = () => {
    setShowAddContent(true)
    setContentForm(prev => ({
      ...prev,
      order: getNextContentOrder()
    }))
  }

  const fetchModules = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/training-modules')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          console.log('Fetched modules in frontend:', result.data)
          setModules(result.data)
        } else {
          setError(result.error || 'Failed to fetch training modules')
        }
      } else {
        setError('Failed to fetch training modules')
      }
    } catch (error) {
      console.error('Error fetching training modules:', error)
      setError('Failed to fetch training modules')
    } finally {
      setLoading(false)
    }
  }

  const fetchModuleContent = async (moduleId: number) => {
    try {
      setContentLoading(true)
      const response = await fetch(`/api/training-modules/${moduleId}/content`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setModuleContent(result.data)
        } else {
          setError(result.error || 'Failed to fetch module content')
        }
      } else {
        setError('Failed to fetch module content')
      }
    } catch (error) {
      console.error('Error fetching module content:', error)
      setError('Failed to fetch module content')
    } finally {
      setContentLoading(false)
    }
  }

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    try {
      const moduleData = {
        title: moduleForm.title,
        description: moduleForm.description || null,
        category: moduleForm.category || null,
        content: moduleForm.content || null,
        isActive: moduleForm.isActive,
        order: moduleForm.order
      }

      console.log('Sending module data:', moduleData)

      const response = await fetch('/api/training-modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moduleData)
      })

      const result = await response.json()

      if (result.success) {
        setMessage('Module created successfully!')
        setShowCreateModule(false)
        setModuleForm({
          title: '',
          description: '',
          category: 'VISAS' as TrainingCategory,
          content: '',
          isActive: true,
          order: 0
        })
        fetchModules()
      } else {
        setError(result.error || 'Failed to create module')
      }
    } catch (error) {
      console.error('Error creating module:', error)
      setError('Failed to create module')
    }
  }

  const handleUpdateModule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingModule) return

    setError('')
    setMessage('')

    try {
      const moduleData = {
        title: moduleForm.title,
        description: moduleForm.description || null,
        category: moduleForm.category || null,
        content: moduleForm.content || null,
        isActive: moduleForm.isActive,
        order: moduleForm.order
      }

      const response = await fetch(`/api/training-modules/${editingModule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moduleData)
      })

      const result = await response.json()

      if (result.success) {
        setMessage('Module updated successfully!')
        setEditingModule(null)
        setModuleForm({
          title: '',
          description: '',
          category: 'VISAS' as TrainingCategory,
          content: '',
          isActive: true,
          order: 0
        })
        fetchModules()
      } else {
        setError(result.error || 'Failed to update module')
      }
    } catch (error) {
      console.error('Error updating module:', error)
      setError('Failed to update module')
    }
  }

  const handleDeleteModule = async (moduleId: number) => {
    if (!confirm('Are you sure you want to delete this module?')) return

    try {
      const response = await fetch(`/api/training-modules/${moduleId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setMessage('Module deleted successfully!')
        fetchModules()
        if (selectedModule?.id === moduleId) {
          setSelectedModule(null)
          setModuleContent([])
        }
      } else {
        setError(result.error || 'Failed to delete module')
      }
    } catch (error) {
      console.error('Error deleting module:', error)
      setError('Failed to delete module')
    }
  }

  const startEditingModule = (module: TrainingModule) => {
    setEditingModule(module)
    setModuleForm({
      title: module.title,
      description: module.description || '',
      category: module.category || 'VISAS',
      content: module.content || '',
      isActive: module.isActive,
      order: module.order
    })
  }

  const handleModuleSelect = (module: TrainingModule) => {
    setSelectedModule(module)
    setCurrentView('content')
    fetchModuleContent(module.id)
  }

  const handleBackToModules = () => {
    setCurrentView('modules')
    setSelectedModule(null)
    setModuleContent([])
    setMessage('')
    setError('')
  }

  const handleDeleteContent = async (contentId: number) => {
    if (!selectedModule || !confirm('Are you sure you want to delete this content item?')) return

    try {
      const response = await fetch(`/api/training-modules/${selectedModule.id}/content/${contentId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setMessage('Content deleted successfully!')
        fetchModuleContent(selectedModule.id)
      } else {
        setError(result.error || 'Failed to delete content')
      }
    } catch (error) {
      console.error('Error deleting content:', error)
      setError('Failed to delete content')
    }
  }

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedModule) return

    setError('')
    setMessage('')

    try {
      // Validation for DOCUMENT type
      if (contentForm.contentType === 'DOCUMENT') {
        if (!_selectedFile && !contentForm.url.trim()) {
          setError('Please either upload a file or provide a document URL')
          return
        }
      }

      const finalUrl = contentForm.url
      const finalFileName = contentForm.fileName
      const finalFileSize = contentForm.fileSize

      // Handle file upload if a file is selected
      if (_selectedFile && contentForm.contentType === 'DOCUMENT') {
        console.log('Uploading training file:', _selectedFile.name, 'Size:', _selectedFile.size, 'Type:', _selectedFile.type)
        
        const formData = new FormData()
        formData.append('file', _selectedFile)
        formData.append('moduleId', selectedModule.id.toString())
        formData.append('title', contentForm.title)
        formData.append('description', contentForm.description || `File: ${_selectedFile.name}`)

        const uploadResponse = await fetch('/api/training-files', {
          method: 'POST',
          body: formData
        })

        console.log('Training file upload response status:', uploadResponse.status)

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          console.error('Training file upload error response:', errorData)
          throw new Error(errorData.error || `Upload failed with status ${uploadResponse.status}`)
        }

        const uploadResult = await uploadResponse.json()
        console.log('Training file upload result:', uploadResult)
        
        if (uploadResult.success) {
          // For training files, we don't need to create additional content record
          // The upload endpoint already created the content record
          await fetchModuleContent(selectedModule.id)
          setShowAddContent(false)
          setContentForm({
            title: '',
            description: '',
            contentType: 'TEXT',
            url: '',
            fileData: '',
            fileName: '',
            fileSize: 0,
            order: 0,
            isActive: true
          })
          setSelectedFile(null)
          setMessage(`File "${_selectedFile.name}" uploaded successfully!`)
          return // Exit early since content was already created
        } else {
          throw new Error(uploadResult.error || 'Failed to upload training file')
        }
      }

      const contentData = {
        title: contentForm.title,
        description: contentForm.description || undefined,
        contentType: contentForm.contentType,
        url: contentForm.contentType === 'TEXT' && !finalUrl.trim() 
          ? contentForm.url  // For TEXT type, send the actual text content in url field
          : finalUrl || undefined,
        fileData: contentForm.fileData || undefined,
        fileName: finalFileName || undefined,
        fileSize: finalFileSize || undefined,
        order: contentForm.order,
        isActive: contentForm.isActive,
        moduleId: selectedModule.id
      }

      console.log('Sending content data:', contentData)

      const response = await fetch(`/api/training-modules/${selectedModule.id}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentData)
      })

      const result = await response.json()
      console.log('Create content response:', result)

      if (result.success) {
        setMessage('Content created successfully!')
        setShowAddContent(false)
        setContentForm({
          title: '',
          description: '',
          contentType: 'TEXT',
          url: '',
          fileData: '',
          fileName: '',
          fileSize: 0,
          order: 0,
          isActive: true
        })
        setSelectedFile(null)
        fetchModuleContent(selectedModule.id)
      } else {
        setError(result.error || 'Failed to create content')
        if (result.details) {
          console.error('Validation details:', result.details)
        }
      }
    } catch (error) {
      console.error('Error creating content:', error)
      setError('Failed to create content')
    }
  }

  const handleUpdateContent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingContent || !selectedModule) return

    setError('')
    setMessage('')

    try {
      const contentData = {
        title: contentForm.title,
        description: contentForm.description || undefined,
        contentType: contentForm.contentType,
        url: contentForm.contentType === 'TEXT' && !contentForm.url.trim() 
          ? contentForm.url  // For TEXT type, send the actual text content in url field
          : contentForm.url || undefined,
        fileData: contentForm.fileData || undefined,
        fileName: contentForm.fileName || undefined,
        fileSize: contentForm.fileSize || undefined,
        order: contentForm.order,
        isActive: contentForm.isActive,
        moduleId: selectedModule.id
      }

      console.log('Sending update content data:', contentData)

      const response = await fetch(`/api/training-modules/${selectedModule.id}/content/${editingContent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentData)
      })

      const result = await response.json()
      console.log('Update content response:', result)

      if (result.success) {
        setMessage('Content updated successfully!')
        setEditingContent(null)
        setShowAddContent(false)
        setContentForm({
          title: '',
          description: '',
          contentType: 'TEXT',
          url: '',
          fileData: '',
          fileName: '',
          fileSize: 0,
          order: 0,
          isActive: true
        })
        setSelectedFile(null)
        fetchModuleContent(selectedModule.id)
      } else {
        setError(result.error || 'Failed to update content')
        if (result.details) {
          console.error('Validation details:', result.details)
        }
      }
    } catch (error) {
      console.error('Error updating content:', error)
      setError('Failed to update content')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              {currentView === 'content' && selectedModule && (
                <button
                  onClick={handleBackToModules}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Modules
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {currentView === 'modules' ? 'Training Modules' : selectedModule?.title}
              </h1>
            </div>
            {user.role === 'ADMIN' && currentView === 'modules' && (
              <button
                onClick={() => setShowCreateModule(true)}
                className="inline-flex items-center px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Module
              </button>
            )}
            {user.role === 'ADMIN' && currentView === 'content' && selectedModule && (
              <button
                onClick={handleShowAddContent}
                className="inline-flex items-center px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Content
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-700">{message}</p>
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Conditional Views */}
        {currentView === 'modules' && (
          /* Modules List */
          <div className="w-full">
            <div className="bg-white rounded-xl shadow-lg border p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
                </svg>
                Training Modules
              </h2>
              
              {/* Modules Grid - 2 per row layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {modules.map((module) => (
                  <div
                    key={module.id}
                    className="p-6 rounded-xl border-2 border-gray-200 hover:border-blue-300 cursor-pointer transition-all duration-200 hover:shadow-lg bg-gradient-to-br from-white to-gray-50"
                    onClick={() => handleModuleSelect(module)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 truncate">
                          {module.title}
                        </h3>
                        {(module.category && module.category.trim() !== '') && (
                          <div className="text-sm font-medium text-blue-600 mt-1">
                            {getCategoryLabel(module.category)}
                          </div>
                        )}
                      </div>
                      {user.role === 'ADMIN' && (
                        <div className="flex gap-2 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              startEditingModule(module)
                            }}
                            className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteModule(module.id)
                            }}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          module.isActive 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {module.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      {module.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {module.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {modules.length === 0 && (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-gray-500 text-lg">No training modules found</p>
                  <p className="text-gray-400 text-sm mt-1">Create your first module to get started</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'content' && selectedModule && (
          /* Module Content View */
          <div className="w-full">
            <div className="bg-white rounded-xl shadow-lg border p-6">
              {/* Module Info Header */}
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedModule.title}</h2>
                    {selectedModule.category && (
                      <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mb-2">
                        {getCategoryLabel(selectedModule.category)}
                      </div>
                    )}
                    {selectedModule.description && (
                      <p className="text-gray-700 mt-2">{selectedModule.description}</p>
                    )}
                  </div>
                  {user.role === 'ADMIN' && (
                    <button
                      onClick={() => startEditingModule(selectedModule)}
                      className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Module
                    </button>
                  )}
                </div>
              </div>

              {/* Content Items */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Content Items
                </h3>

                {contentLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : moduleContent.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 text-lg">No content items found</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {user.role === 'ADMIN' ? 'Add your first content item to get started' : 'This module has no content yet'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {moduleContent.map((content) => (
                      <div key={content.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{content.title}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                content.contentType === 'VIDEO' || content.contentType === 'YOUTUBE'
                                  ? 'bg-red-100 text-red-800' 
                                  : content.contentType === 'DOCUMENT'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {content.contentType === 'YOUTUBE' ? 'VIDEO' : content.contentType}
                              </span>
                            </div>
                            {content.description && (
                              <p className="text-gray-600 text-sm mb-4">{content.description}</p>
                            )}
                          </div>
                          {user.role === 'ADMIN' && (
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => {
                                  setEditingContent(content)
                                  setContentForm({
                                    title: content.title,
                                    description: content.description || '',
                                    contentType: content.contentType,
                                    url: content.url || '',
                                    fileData: content.fileData || '',
                                    fileName: content.fileName || '',
                                    fileSize: content.fileSize || 0,
                                    order: content.order,
                                    isActive: content.isActive
                                  })
                                  setShowAddContent(true)
                                }}
                                className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteContent(content.id)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Render content based on type */}
                        {(content.contentType === 'VIDEO' || content.contentType === 'YOUTUBE') && content.url && (
                          <div className="rounded-lg overflow-hidden">
                            <iframe
                              src={getYouTubeEmbedUrl(content.url)}
                              className="w-full h-64 sm:h-96"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                        )}

                        {content.contentType === 'DOCUMENT' && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div>
                                <p className="font-medium text-gray-900">{content.fileName || 'Document'}</p>
                                {content.fileSize && (
                                  <p className="text-sm text-gray-500">{(content.fileSize / 1024).toFixed(1)} KB</p>
                                )}
                              </div>
                              {content.url && (
                                <a
                                  href={content.url}
                                  download={content.fileName || 'document'}
                                  className="ml-auto px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Download Document
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {content.contentType === 'TEXT' && content.url && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="prose max-w-none">
                              <p className="text-gray-700">{content.url}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Module Modal */}
      {(showCreateModule || editingModule) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  {editingModule ? 'Edit Module' : 'Create New Module'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModule(false)
                    setEditingModule(null)
                    setModuleForm({
                      title: '',
                      description: '',
                      category: 'VISAS' as TrainingCategory,
                      content: '',
                      isActive: true,
                      order: 0
                    })
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={editingModule ? handleUpdateModule : handleCreateModule} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module Title *
                  </label>
                  <input
                    type="text"
                    value={moduleForm.title}
                    onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={moduleForm.description}
                    onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={moduleForm.category}
                    onChange={(e) => setModuleForm({ ...moduleForm, category: e.target.value as TrainingCategory })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {TRAINING_CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={moduleForm.isActive}
                    onChange={(e) => setModuleForm({ ...moduleForm, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Active Module
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-lg hover:from-orange-600 hover:to-red-600 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {editingModule ? 'Update Module' : 'Create Module'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModule(false)
                      setEditingModule(null)
                      setModuleForm({
                        title: '',
                        description: '',
                        category: 'VISAS' as TrainingCategory,
                        content: '',
                        isActive: true,
                        order: 0
                      })
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Content Modal */}
      {showAddContent && selectedModule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  {editingContent ? 'Edit Content Item' : 'Add New Content Item'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddContent(false)
                    setEditingContent(null)
                    setContentForm({
                      title: '',
                      description: '',
                      contentType: 'TEXT',
                      url: '',
                      fileData: '',
                      fileName: '',
                      fileSize: 0,
                      order: 0,
                      isActive: true
                    })
                    setSelectedFile(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={editingContent ? handleUpdateContent : handleCreateContent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Title *
                  </label>
                  <input
                    type="text"
                    value={contentForm.title}
                    onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={contentForm.description}
                    onChange={(e) => setContentForm({ ...contentForm, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Type *
                  </label>
                  <select
                    value={contentForm.contentType}
                    onChange={(e) => setContentForm({ ...contentForm, contentType: e.target.value as ContentType })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="TEXT">Text Content</option>
                    <option value="VIDEO">YouTube Video</option>
                    <option value="DOCUMENT">Document/File</option>
                  </select>
                </div>

                {contentForm.contentType === 'VIDEO' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      YouTube URL *
                    </label>
                    <input
                      type="url"
                      value={contentForm.url}
                      onChange={(e) => setContentForm({ ...contentForm, url: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="https://www.youtube.com/watch?v=..."
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Enter a YouTube URL (supports youtube.com/watch and youtu.be formats)
                    </p>
                  </div>
                )}

                {contentForm.contentType === 'DOCUMENT' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Document Source *
                      </label>
                      <div className="space-y-3">
                        {/* File Upload Option */}
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            📁 Upload Local File
                          </label>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setSelectedFile(file)
                                // Auto-fill title if empty
                                if (!contentForm.title) {
                                  setContentForm(prev => ({ 
                                    ...prev, 
                                    title: file.name.replace(/\.[^/.]+$/, '') 
                                  }))
                                }
                                // Set file info
                                setContentForm(prev => ({
                                  ...prev,
                                  fileName: file.name,
                                  fileSize: file.size,
                                  url: '' // Clear URL when file is selected
                                }))
                              }
                            }}
                            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors hover:border-gray-400"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Supported formats: PDF, Word, Excel, PowerPoint, Images (Max 10MB)
                          </p>
                          {_selectedFile && (
                            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-green-700">
                                  File selected: <strong>{_selectedFile.name}</strong> ({Math.round(_selectedFile.size / 1024)} KB)
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* URL Option */}
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            🌐 Or Enter Document URL
                          </label>
                          <input
                            type="url"
                            value={contentForm.url}
                            onChange={(e) => {
                              setContentForm({ ...contentForm, url: e.target.value })
                              if (e.target.value) {
                                setSelectedFile(null) // Clear file when URL is entered
                              }
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="https://example.com/document.pdf"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Display Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={contentForm.fileName}
                        onChange={(e) => setContentForm({ ...contentForm, fileName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Custom name to display (will use filename if empty)"
                      />
                    </div>
                  </div>
                )}

                {contentForm.contentType === 'TEXT' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text Content *
                    </label>
                    <textarea
                      value={contentForm.url}
                      onChange={(e) => setContentForm({ ...contentForm, url: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      rows={6}
                      placeholder="Enter your text content here..."
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={contentForm.order}
                      onChange={(e) => setContentForm({ ...contentForm, order: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      min="1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Content will be shown in this order (lower numbers appear first)
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-8">
                    <input
                      type="checkbox"
                      id="contentIsActive"
                      checked={contentForm.isActive}
                      onChange={(e) => setContentForm({ ...contentForm, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="contentIsActive" className="text-sm font-medium text-gray-700">
                      Active Content
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-6 rounded-lg hover:from-green-600 hover:to-blue-600 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {editingContent ? 'Update Content' : 'Add Content'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddContent(false)
                      setEditingContent(null)
                      setContentForm({
                        title: '',
                        description: '',
                        contentType: 'TEXT',
                        url: '',
                        fileData: '',
                        fileName: '',
                        fileSize: 0,
                        order: 0,
                        isActive: true
                      })
                      setSelectedFile(null)
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}