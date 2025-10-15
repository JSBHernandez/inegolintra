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
  
  // Content tab state
  const [activeTab, setActiveTab] = useState<'videos' | 'documents' | 'texts'>('videos')
  
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
    setActiveTab('videos') // Reset to first tab
    setMessage('')
    setError('')
  }

  // Helper functions to filter content by type
  const getVideoContent = () => moduleContent.filter(content => 
    content.contentType === 'VIDEO' || content.contentType === 'YOUTUBE'
  ).sort((a, b) => (a.order || 0) - (b.order || 0))

  const getDocumentContent = () => moduleContent.filter(content => 
    content.contentType === 'DOCUMENT'
  ).sort((a, b) => (a.order || 0) - (b.order || 0))

  const getTextContent = () => moduleContent.filter(content => 
    content.contentType === 'TEXT'
  ).sort((a, b) => (a.order || 0) - (b.order || 0))

  const getContentCounts = () => ({
    videos: getVideoContent().length,
    documents: getDocumentContent().length,
    texts: getTextContent().length
  })

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
        {/* Header - Only show in modules view */}
        {currentView === 'modules' && (
          <div className="bg-white rounded-2xl shadow-sm border">
            <div className="px-6 sm:px-8 py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Navigation & Title */}
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Learning Center
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      Training Modules
                    </h1>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  {user.role === 'ADMIN' && (
                    <button
                      onClick={() => setShowCreateModule(true)}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Module
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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
          /* Modules List - Domestika Inspired Design */
          <div className="w-full">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 mb-8 border border-orange-100">
              <div className="max-w-4xl">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Discover Your Learning Journey
                </h2>
                <p className="text-gray-700 text-lg leading-relaxed">
                  Explore our curated collection of training modules designed to enhance your skills and expertise. 
                  Each module contains carefully crafted content including videos, documents, and interactive materials.
                </p>
              </div>
            </div>

            {/* Statistics Bar */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500 mb-2">{modules.length}</div>
                  <div className="text-gray-600 font-medium">Available Modules</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500 mb-2">
                    {modules.filter(m => m.isActive).length}
                  </div>
                  <div className="text-gray-600 font-medium">Active Courses</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500 mb-2">
                    {new Set(modules.map(m => m.category).filter(Boolean)).size}
                  </div>
                  <div className="text-gray-600 font-medium">Categories</div>
                </div>
              </div>
            </div>

            {/* Module Cards Grid */}
            <div className="bg-white rounded-2xl shadow-sm border p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Training Modules</h3>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  {modules.length} modules available
                </div>
              </div>

              {/* Modules Grid - Modern Domestika Style */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {modules.map((module) => (
                  <div
                    key={module.id}
                    className="group cursor-pointer"
                    onClick={() => handleModuleSelect(module)}
                  >
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                      {/* Module Image/Icon */}
                      <div className="relative h-48 bg-gradient-to-br from-orange-400 via-red-400 to-pink-400 p-6 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                        <div className="relative z-10 text-center">
                          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3 mx-auto backdrop-blur-sm">
                            {module.category === 'VISAS' && (
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                              </svg>
                            )}
                            {module.category === 'TECHNOLOGY' && (
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            )}
                            {(!module.category || !['VISAS', 'TECHNOLOGY'].includes(module.category)) && (
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            )}
                          </div>
                          <div className="text-white text-sm font-medium opacity-90">
                            {getCategoryLabel(module.category) || 'Training'}
                          </div>
                        </div>
                        
                        {/* Admin Controls */}
                        {user.role === 'ADMIN' && (
                          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditingModule(module)
                              }}
                              className="p-2 bg-blue-500 bg-opacity-80 backdrop-blur-sm text-white rounded-lg hover:bg-opacity-100 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteModule(module.id)
                              }}
                              className="p-2 bg-red-500 bg-opacity-80 backdrop-blur-sm text-white rounded-lg hover:bg-opacity-100 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Module Content */}
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            module.isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {module.isActive ? '✓ Active' : '○ Inactive'}
                          </span>
                        </div>

                        <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                          {module.title}
                        </h3>
                        
                        {module.description && (
                          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">
                            {module.description}
                          </p>
                        )}

                        {/* Action Button */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Start Learning
                          </div>
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {modules.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No training modules yet</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    {user.role === 'ADMIN' 
                      ? 'Get started by creating your first training module to begin building your course library.'
                      : 'No training modules are available at the moment. Check back later for new content.'
                    }
                  </p>
                  {user.role === 'ADMIN' && (
                    <button
                      onClick={() => setShowCreateModule(true)}
                      className="inline-flex items-center px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create First Module
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'content' && selectedModule && (
          <div className="w-full">
            {/* Module Content View - Domestika Style with Tabs */}
            {/* Content Tabs Navigation */}
            <div className="bg-white rounded-2xl shadow-sm border mb-8">
              {/* Module Header with Navigation */}
              <div className="px-8 py-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  {/* Left side: Back button and Module info */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setCurrentView('modules')}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200 font-medium group"
                    >
                      <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Modules
                    </button>
                    
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-bold text-gray-900">{selectedModule.title}</h1>
                        {selectedModule.category && (
                          <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                            {selectedModule.category}
                          </span>
                        )}
                      </div>
                      {selectedModule.description && (
                        <p className="text-gray-600 text-sm max-w-2xl">{selectedModule.description}</p>
                      )}
                      
                      {/* Content Statistics */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{selectedModule.contentItems?.filter(item => item.contentType === 'VIDEO' || item.contentType === 'YOUTUBE').length || 0} Videos</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>{selectedModule.contentItems?.filter(item => item.contentType === 'DOCUMENT').length || 0} Documents</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span>{selectedModule.contentItems?.filter(item => item.contentType === 'TEXT').length || 0} Texts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side: Admin buttons */}
                  {user.role === 'ADMIN' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setEditingModule(selectedModule)}
                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit Module
                      </button>
                      <button
                        onClick={() => setShowAddContent(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Content
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Tabs Navigation */}
                <nav className="flex space-x-8 px-8" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('videos')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                      activeTab === 'videos'
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Videos
                      {getContentCounts().videos > 0 && (
                        <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                          {getContentCounts().videos}
                        </span>
                      )}
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('documents')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'documents'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Documents
                      {getContentCounts().documents > 0 && (
                        <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                          {getContentCounts().documents}
                        </span>
                      )}
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('texts')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'texts'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Reading
                      {getContentCounts().texts > 0 && (
                        <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">
                          {getContentCounts().texts}
                        </span>
                      )}
                    </div>
                  </button>
                </nav>

              {/* Tab Content */}
              <div className="p-8">
                {contentLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  </div>
                ) : (
                  <div>
                    {/* Videos Tab */}
                    {activeTab === 'videos' && (
                      <div>
                        {getVideoContent().length === 0 ? (
                          <div className="text-center py-16">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-10 h-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No videos yet</h3>
                            <p className="text-gray-500 mb-6">
                              {user.role === 'ADMIN' 
                                ? 'Add video content to enhance the learning experience.'
                                : 'Video content will appear here when available.'
                              }
                            </p>
                          </div>
                        ) : (
                          <div className="grid gap-6">
                            {getVideoContent().map((content) => (
                              <div key={content.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="flex flex-col lg:flex-row">
                                  {/* Video Player */}
                                  <div className="lg:w-1/2">
                                    <div className="aspect-video">
                                      <iframe
                                        src={getYouTubeEmbedUrl(content.url || '')}
                                        className="w-full h-full"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      ></iframe>
                                    </div>
                                  </div>
                                  
                                  {/* Video Info */}
                                  <div className="lg:w-1/2 p-6">
                                    <div className="flex justify-between items-start mb-4">
                                      <div className="flex-1">
                                        <h4 className="text-xl font-semibold text-gray-900 mb-2">{content.title}</h4>
                                        {content.description && (
                                          <p className="text-gray-600 leading-relaxed">{content.description}</p>
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
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Documents Tab */}
                    {activeTab === 'documents' && (
                      <div>
                        {getDocumentContent().length === 0 ? (
                          <div className="text-center py-16">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
                            <p className="text-gray-500 mb-6">
                              {user.role === 'ADMIN' 
                                ? 'Upload documents, PDFs, and other files to support learning.'
                                : 'Downloadable resources will appear here when available.'
                              }
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {getDocumentContent().map((content) => (
                              <div key={content.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex-1">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 mb-2">{content.title}</h4>
                                    {content.description && (
                                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{content.description}</p>
                                    )}
                                    <div className="flex items-center justify-between">
                                      <div className="text-sm text-gray-500">
                                        {content.fileName && (
                                          <span className="font-medium">{content.fileName}</span>
                                        )}
                                        {content.fileSize && (
                                          <span className="ml-2">({(content.fileSize / 1024).toFixed(1)} KB)</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {user.role === 'ADMIN' && (
                                    <div className="flex gap-1 ml-2">
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
                                        className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteContent(content.id)}
                                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  )}
                                </div>
                                
                                {content.url && (
                                  <a
                                    href={content.url}
                                    download={content.fileName || 'document'}
                                    className="block w-full mt-4 px-4 py-2 bg-blue-500 text-white text-center rounded-lg hover:bg-blue-600 transition-colors"
                                  >
                                    Download Document
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Texts Tab */}
                    {activeTab === 'texts' && (
                      <div>
                        {getTextContent().length === 0 ? (
                          <div className="text-center py-16">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-10 h-10 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reading materials yet</h3>
                            <p className="text-gray-500 mb-6">
                              {user.role === 'ADMIN' 
                                ? 'Add text content, guides, and reading materials here.'
                                : 'Text content and reading materials will appear here when available.'
                              }
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {getTextContent().map((content) => (
                              <div key={content.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex-1">
                                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{content.title}</h4>
                                    {content.description && (
                                      <p className="text-gray-600 mb-4">{content.description}</p>
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
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteContent(content.id)}
                                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" />
                                        </svg>
                                      </button>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="bg-gray-50 rounded-lg p-6">
                                  <div className="prose max-w-none">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content.url}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Module Modal */}
      {(showCreateModule || editingModule) && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full transform transition-all">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">
                    {editingModule ? 'Edit Module' : 'Create New Module'}
                  </h3>
                  <p className="text-gray-600">
                    {editingModule ? 'Update your training module details' : 'Set up a new learning experience for your team'}
                  </p>
                </div>
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
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={editingModule ? handleUpdateModule : handleCreateModule} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Module Title *
                  </label>
                  <input
                    type="text"
                    value={moduleForm.title}
                    onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-lg"
                    placeholder="Enter a compelling module title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Description
                  </label>
                  <textarea
                    value={moduleForm.description}
                    onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    rows={4}
                    placeholder="Describe what learners will gain from this module..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Category
                  </label>
                  <select
                    value={moduleForm.category}
                    onChange={(e) => setModuleForm({ ...moduleForm, category: e.target.value as TrainingCategory })}
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-lg"
                  >
                    {TRAINING_CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={moduleForm.isActive}
                    onChange={(e) => setModuleForm({ ...moduleForm, isActive: e.target.checked })}
                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">
                    Make module active and available to learners
                  </label>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-8 rounded-xl hover:from-orange-600 hover:to-red-600 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
                    className="px-8 py-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">
                    {editingContent ? 'Edit Content Item' : 'Add New Content Item'}
                  </h3>
                  <p className="text-gray-600">
                    {editingContent ? 'Update your content details' : 'Create engaging content for your learners'}
                  </p>
                </div>
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
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={editingContent ? handleUpdateContent : handleCreateContent} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Content Title *
                  </label>
                  <input
                    type="text"
                    value={contentForm.title}
                    onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-lg"
                    placeholder="Enter a descriptive title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Description (Optional)
                  </label>
                  <textarea
                    value={contentForm.description}
                    onChange={(e) => setContentForm({ ...contentForm, description: e.target.value })}
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    rows={3}
                    placeholder="Add a helpful description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Content Type *
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setContentForm({ ...contentForm, contentType: 'TEXT' })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        contentForm.contentType === 'TEXT'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <div className="font-medium">Text Content</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentForm({ ...contentForm, contentType: 'VIDEO' })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        contentForm.contentType === 'VIDEO'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div className="font-medium">YouTube Video</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentForm({ ...contentForm, contentType: 'DOCUMENT' })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        contentForm.contentType === 'DOCUMENT'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="font-medium">Document/File</div>
                    </button>
                  </div>
                </div>

                {contentForm.contentType === 'VIDEO' && (
                  <div className="bg-red-50 rounded-xl p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      YouTube URL *
                    </label>
                    <input
                      type="url"
                      value={contentForm.url}
                      onChange={(e) => setContentForm({ ...contentForm, url: e.target.value })}
                      className="w-full px-4 py-4 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                      placeholder="https://www.youtube.com/watch?v=..."
                      required
                    />
                    <p className="text-sm text-red-600 mt-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Supports youtube.com/watch and youtu.be formats
                    </p>
                  </div>
                )}

                {contentForm.contentType === 'DOCUMENT' && (
                  <div className="bg-blue-50 rounded-xl p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Document Source *
                      </label>
                      <div className="space-y-4">
                        {/* File Upload Option */}
                        <div>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setSelectedFile(file)
                                if (!contentForm.title) {
                                  setContentForm(prev => ({ 
                                    ...prev, 
                                    title: file.name.replace(/\.[^/.]+$/, '') 
                                  }))
                                }
                                setContentForm(prev => ({
                                  ...prev,
                                  fileName: file.name,
                                  fileSize: file.size,
                                  url: ''
                                }))
                              }
                            }}
                            className="hidden"
                            id="training-file-upload"
                          />
                          <label 
                            htmlFor="training-file-upload"
                            className="flex flex-col items-center justify-center px-6 py-8 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-400 cursor-pointer transition-colors bg-white"
                          >
                            <svg className="w-12 h-12 text-blue-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-blue-600 font-medium text-lg">Upload File</span>
                            <span className="text-blue-500 text-sm mt-1">PDF, Word, Excel, PowerPoint, Images (Max 10MB)</span>
                          </label>
                          {_selectedFile && (
                            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                              <div className="flex items-center gap-3">
                                <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <div>
                                  <div className="font-medium text-green-800">{_selectedFile?.name}</div>
                                  <div className="text-sm text-green-600">{Math.round(_selectedFile?.size || 0 / 1024)} KB</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* URL Option */}
                        <div className="text-center text-gray-500 font-medium">OR</div>
                        <div>
                          <input
                            type="url"
                            value={contentForm.url}
                            onChange={(e) => {
                              setContentForm({ ...contentForm, url: e.target.value })
                              if (e.target.value) {
                                setSelectedFile(null)
                              }
                            }}
                            className="w-full px-4 py-4 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="Or enter document URL..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {contentForm.contentType === 'TEXT' && (
                  <div className="bg-green-50 rounded-xl p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Text Content *
                    </label>
                    <textarea
                      value={contentForm.url}
                      onChange={(e) => setContentForm({ ...contentForm, url: e.target.value })}
                      className="w-full px-4 py-4 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      rows={8}
                      placeholder="Enter your text content here..."
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={contentForm.order}
                      onChange={(e) => setContentForm({ ...contentForm, order: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      min="1"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-8">
                    <input
                      type="checkbox"
                      id="contentIsActive"
                      checked={contentForm.isActive}
                      onChange={(e) => setContentForm({ ...contentForm, isActive: e.target.checked })}
                      className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="contentIsActive" className="text-sm font-semibold text-gray-700">
                      Make content active and visible
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-8 rounded-xl hover:from-orange-600 hover:to-red-600 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
                    className="px-8 py-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
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
  );
}