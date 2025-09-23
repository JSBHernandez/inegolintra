'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'

interface Paralegal {
  id: number
  name: string
  isActive: boolean
  createdAt: string
}

interface ParalegalManagerProps {
  isOpen: boolean
  onClose: () => void
}

export default function ParalegalManager({ isOpen, onClose }: ParalegalManagerProps) {
  const [paralegals, setParalegals] = useState<Paralegal[]>([])
  const [loading, setLoading] = useState(true)
  const [submitMessage, setSubmitMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ name: string }>()

  // Fetch paralegals
  const fetchParalegals = async () => {
    try {
      const response = await fetch('/api/paralegals')
      const result = await response.json()
      
      if (result.success) {
        setParalegals(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch paralegals:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchParalegals()
    }
  }, [isOpen])

  // Add new paralegal
  const onSubmit = async (data: { name: string }) => {
    setIsSubmitting(true)
    setSubmitMessage('')

    try {
      const response = await fetch('/api/paralegals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: data.name }),
      })

      const result = await response.json()

      if (result.success) {
        setSubmitMessage('Paralegal added successfully!')
        reset()
        fetchParalegals()
      } else {
        setSubmitMessage(`Error: ${result.error}`)
      }
    } catch {
      setSubmitMessage('Failed to add paralegal. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle paralegal active status
  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/paralegals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id, 
          isActive: !currentStatus 
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSubmitMessage(
          !currentStatus 
            ? 'Paralegal activated successfully!' 
            : 'Paralegal deactivated successfully!'
        )
        fetchParalegals()
      } else {
        setSubmitMessage(`Error: ${result.error}`)
      }
    } catch {
      setSubmitMessage('Failed to update paralegal status.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative p-6 border max-w-2xl w-full mx-4 shadow-xl rounded-lg bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Manage Paralegals</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Add New Paralegal Form */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-lg font-medium text-gray-900 mb-3">Add New Paralegal</h4>
          <form onSubmit={handleSubmit(onSubmit)} className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                {...register('name', { 
                  required: 'Paralegal name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  maxLength: { value: 100, message: 'Name must be less than 100 characters' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter paralegal name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>

        {/* Paralegals List */}
        <div className="mb-4">
          <h4 className="text-lg font-medium text-gray-900 mb-3">Current Paralegals</h4>
          
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
            </div>
          ) : paralegals.length > 0 ? (
            <div className="space-y-2">
              {paralegals.map((paralegal) => (
                <div key={paralegal.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900">{paralegal.name}</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      paralegal.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {paralegal.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleToggleActive(paralegal.id, paralegal.isActive)}
                    className={`px-3 py-1 text-sm rounded-md font-medium ${
                      paralegal.isActive
                        ? 'bg-red-100 text-red-800 hover:bg-red-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {paralegal.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No paralegals found.</p>
          )}
        </div>

        {/* Message Display */}
        {submitMessage && (
          <div className={`mb-4 p-3 rounded-md ${
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

        {/* Info Note */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Deactivating a paralegal will remove them from the dropdown list for new cases, 
            but existing cases will keep their assigned paralegal names unchanged.
          </p>
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}