'use client'

import { useState, useEffect } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createNewsSchema, CreateNewsFormData } from '@/lib/validations'
import { News } from '@/types'
import { AuthUser } from '@/types'

interface NewsManagementProps {
  user: AuthUser
}

export default function NewsManagement({ user: _user }: NewsManagementProps) {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  const createForm = useForm<CreateNewsFormData>({
    resolver: zodResolver(createNewsSchema),
    defaultValues: {
      title: '',
      content: '',
      imageUrl: ''
    }
  })

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news?includeInactive=true')
      const result = await response.json()

      if (result.success) {
        setNews(result.data)
      } else {
        setSubmitMessage(`Error: ${result.error}`)
      }
    } catch {
      setSubmitMessage('Failed to fetch news')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNews: SubmitHandler<CreateNewsFormData> = async (data) => {
    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        setSubmitMessage('News created successfully!')
        createForm.reset()
        setShowCreateForm(false)
        fetchNews()
      } else {
        setSubmitMessage(`Error: ${result.error}`)
      }
    } catch {
      setSubmitMessage('Failed to create news')
    }
  }

  const handleToggleActive = async (newsId: number, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/news', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newsId, isActive: !currentStatus }),
      })

      const result = await response.json()

      if (result.success) {
        setSubmitMessage(`News ${!currentStatus ? 'activated' : 'deactivated'} successfully!`)
        fetchNews()
      } else {
        setSubmitMessage(`Error: ${result.error}`)
      }
    } catch {
      setSubmitMessage('Failed to update news status')
    }
  }

  const handleDeleteNews = async (newsId: number) => {
    if (!confirm('Are you sure you want to delete this news article? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/news?id=${newsId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setSubmitMessage('News deleted successfully!')
        fetchNews()
      } else {
        setSubmitMessage(`Error: ${result.error}`)
      }
    } catch {
      setSubmitMessage('Failed to delete news')
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSubmitMessage('Please select an image file (JPG or PNG)')
      return
    }

    // Validate file size (2MB for deployment compatibility)
    if (file.size > 2 * 1024 * 1024) {
      setSubmitMessage('File size must be less than 2MB for deployment compatibility')
      return
    }

    setUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append('photo', file)

      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        createForm.setValue('imageUrl', result.photoUrl)
        setSubmitMessage('Image uploaded successfully!')
      } else {
        setSubmitMessage(`Error uploading image: ${result.error}`)
      }
    } catch {
      setSubmitMessage('Connection error while uploading image')
    } finally {
      setUploadingImage(false)
    }
  }

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
            <h2 className="text-2xl font-bold text-gray-900">News Management</h2>
            <p className="mt-1 text-gray-600">Create and manage news articles for the dashboard</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors font-medium"
          >
            + Create News
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

      {/* News List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            News Articles ({news.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {news.map((article) => (
            <div key={article.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{article.title}</h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      article.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {article.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3 line-clamp-3">{article.content}</p>
                  
                  {article.imageUrl && (
                    <div className="mb-3">
                      <img 
                        src={article.imageUrl} 
                        alt={article.title}
                        className="h-24 w-auto rounded-md object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-500">
                    Created by {article.author.name} on {formatDate(article.createdAt)}
                    {article.updatedAt !== article.createdAt && (
                      <span> • Updated {formatDate(article.updatedAt)}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(article.id, article.isActive)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      article.isActive
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {article.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteNews(article.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {news.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No news articles created yet. Click &quot;Create News&quot; to add the first article.
            </div>
          )}
        </div>
      </div>

      {/* Create News Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl p-6 m-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Create News Article</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form onSubmit={createForm.handleSubmit(handleCreateNews)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  {...createForm.register('title')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter news title"
                />
                {createForm.formState.errors.title && (
                  <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  {...createForm.register('content')}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter news content"
                />
                {createForm.formState.errors.content && (
                  <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.content.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image (Optional)
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  />
                  <p className="text-xs text-gray-500">JPG or PNG, max 2MB (deployment optimized)</p>
                  
                  {createForm.watch('imageUrl') && (
                    <div className="mt-2">
                      <img 
                        src={createForm.watch('imageUrl')} 
                        alt="Preview"
                        className="h-32 w-auto rounded-md object-cover"
                      />
                    </div>
                  )}
                </div>
                {createForm.formState.errors.imageUrl && (
                  <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.imageUrl.message}</p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  {uploadingImage ? 'Uploading...' : 'Create News'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
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