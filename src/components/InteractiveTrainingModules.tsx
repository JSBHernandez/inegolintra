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

export default function InteractiveTrainingModules({ user }: InteractiveTrainingModulesProps) {
  const [modules, setModules] = useState<TrainingModule[]>([])
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null)
  const [moduleContent, setModuleContent] = useState<TrainingModuleContent[]>([])
  const [loading, setLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  
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

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    fetchModules()
  }, [])

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
    fetchModuleContent(module.id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Interactive Training Modules</h1>
          {user.role === 'ADMIN' && (
            <button
              onClick={() => setShowCreateModule(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-red-600 focus:ring-4 focus:ring-orange-200 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Module
            </button>
          )}
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

        {/* Modules List - Now Full Width */}
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
    </div>
  )
}