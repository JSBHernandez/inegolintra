'use client'

import { useState, useEffect } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthUser, TrainingModule } from '@/types'
import { 
  trainingModuleSchema, 
  TrainingModuleFormData,
  trainingCategoryOptions
} from '@/lib/validations'

interface TrainingModulesProps {
  user: AuthUser
}

export default function TrainingModules({ user }: TrainingModulesProps) {
  const [modules, setModules] = useState<TrainingModule[]>([])
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitMessage, setSubmitMessage] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('')

  const form = useForm<TrainingModuleFormData>({
    resolver: zodResolver(trainingModuleSchema),
    defaultValues: {
      isActive: true,
      order: 0
    }
  })

  useEffect(() => {
    fetchModules()
  }, [])

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/training-modules')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setModules(result.data)
        }
      }
    } catch (error) {
      console.error('Error fetching training modules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit: SubmitHandler<TrainingModuleFormData> = async (data) => {
    try {
      const url = editingModule ? `/api/training-modules` : '/api/training-modules'
      const method = editingModule ? 'PUT' : 'POST'
      const payload = editingModule ? { ...data, id: editingModule.id } : data

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (result.success) {
        setSubmitMessage(`Training module ${editingModule ? 'updated' : 'created'} successfully!`)
        form.reset()
        setShowForm(false)
        setEditingModule(null)
        fetchModules()
      } else {
        setSubmitMessage(`Error: ${result.error}`)
      }
    } catch {
      setSubmitMessage(`Failed to ${editingModule ? 'update' : 'create'} training module`)
    }
  }

  const handleEdit = (module: TrainingModule) => {
    setEditingModule(module)
    form.reset({
      title: module.title,
      description: module.description || '',
      category: module.category || '',
      content: module.content,
      isActive: module.isActive,
      order: module.order,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this training module?')) {
      return
    }

    try {
      const response = await fetch('/api/training-modules', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      const result = await response.json()
      if (result.success) {
        setSubmitMessage('Training module deleted successfully!')
        fetchModules()
      } else {
        setSubmitMessage(`Error: ${result.error}`)
      }
    } catch {
      setSubmitMessage('Failed to delete training module')
    }
  }

  const handleCompleteModule = async (moduleId: number) => {
    try {
      const response = await fetch('/api/training-modules/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId }),
      })

      const result = await response.json()
      if (result.success) {
        setSubmitMessage('Module completed successfully!')
        fetchModules()
      } else {
        setSubmitMessage(`Error: ${result.error}`)
      }
    } catch {
      setSubmitMessage('Failed to mark module as completed')
    }
  }

  const filteredModules = modules.filter(module => 
    filterCategory === '' || module.category === filterCategory
  ).sort((a, b) => a.order - b.order)

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'VISAS': 'bg-blue-100 text-blue-800',
      'IMMIGRATION_LAW': 'bg-purple-100 text-purple-800',
      'CUSTOMER_SERVICE': 'bg-green-100 text-green-800',
      'TECHNOLOGY': 'bg-indigo-100 text-indigo-800',
      'COMPLIANCE': 'bg-red-100 text-red-800',
      'SAFETY': 'bg-yellow-100 text-yellow-800',
      'OTHER': 'bg-gray-100 text-gray-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Training Modules</h2>
            <p className="mt-1 text-gray-600">Access training materials and track your progress</p>
          </div>
          <div className="flex space-x-3">
            {user.role === 'ADMIN' && (
              <button
                onClick={() => {
                  setEditingModule(null)
                  form.reset({ isActive: true, order: 0 })
                  setShowForm(true)
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
              >
                Create Module
              </button>
            )}
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by category:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          >
            <option value="">All Categories</option>
            {trainingCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Module List */}
      {selectedModule ? (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <button
                  onClick={() => setSelectedModule(null)}
                  className="text-orange-600 hover:text-orange-700 text-sm mb-2 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                  Back to modules
                </button>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedModule.title}</h3>
                <div className="flex items-center space-x-3">
                  {selectedModule.category && (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(selectedModule.category)}`}>
                      {selectedModule.category.replace('_', ' ')}
                    </span>
                  )}
                  {selectedModule.isActive ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      Inactive
                    </span>
                  )}
                </div>
                {selectedModule.description && (
                  <p className="text-gray-600 mt-2">{selectedModule.description}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleCompleteModule(selectedModule.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                >
                  Mark as Complete
                </button>
                {user.role === 'ADMIN' && (
                  <>
                    <button
                      onClick={() => handleEdit(selectedModule)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(selectedModule.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="p-6">
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedModule.content || '' }}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredModules.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">No training modules found.</p>
            </div>
          ) : (
            filteredModules.map((module) => (
              <div key={module.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{module.title}</h3>
                    {user.role === 'ADMIN' && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(module)}
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="Edit module"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(module.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Delete module"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    {module.category && (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(module.category)}`}>
                        {module.category.replace('_', ' ')}
                      </span>
                    )}
                    {module.isActive ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </div>

                  {module.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{module.description}</p>
                  )}

                  <button
                    onClick={() => setSelectedModule(module)}
                    className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors text-sm"
                  >
                    Start Training
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create/Edit Module Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl p-6 m-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingModule ? 'Edit Training Module' : 'Create Training Module'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingModule(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  {...form.register('title')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Training module title"
                />
                {form.formState.errors.title && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  {...form.register('category')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select category</option>
                  {trainingCategoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {form.formState.errors.category && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  {...form.register('description')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Brief description of the training module"
                />
                {form.formState.errors.description && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  {...form.register('content')}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Training content (HTML supported)"
                />
                {form.formState.errors.content && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.content.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...form.register('order', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {form.formState.errors.order && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.order.message}</p>
                  )}
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...form.register('isActive')}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {editingModule ? 'Update Module' : 'Create Module'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingModule(null)
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
