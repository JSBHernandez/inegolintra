'use client'

import { useState } from 'react'
import { ClientCaseForm, ClientCasesList } from './index'
import { ClientCase } from '@/types'

export default function ClientPortal() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [editingCase, setEditingCase] = useState<ClientCase | null>(null)
  const [showFormModal, setShowFormModal] = useState(false)

  const handleFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
    setShowFormModal(false)
  }

  const handleEditCase = (clientCase: ClientCase) => {
    // Ensure status has a default value for backward compatibility
    const caseWithStatus = {
      ...clientCase,
      status: clientCase.status || 'Active'
    }
    setEditingCase(caseWithStatus)
    setShowFormModal(true)
  }

  const handleCancelEdit = () => {
    setEditingCase(null)
    setShowFormModal(false)
  }

  return (
    <div className="max-w-full">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Client Portal</h2>
            <p className="mt-1 text-gray-600">Manage immigration cases and client contracts efficiently</p>
          </div>
          <button
            onClick={() => setShowFormModal(true)}
            className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors font-medium"
          >
            + Register New Client Case
          </button>
        </div>
      </div>

      {/* Main Content */}
      <ClientCasesList 
        refreshTrigger={refreshTrigger}
        onEdit={handleEditCase}
      />

      {/* Form Modal */}
      {showFormModal && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-30 overflow-y-auto h-full w-full z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={handleCancelEdit}
        >
          <div 
            className="relative p-6 border max-w-lg w-full mx-4 shadow-xl rounded-lg bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingCase ? 'Edit Client Case' : 'Register New Client Case'}
              </h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <ClientCaseForm 
              onSuccess={handleFormSuccess} 
              editingCase={editingCase}
              onCancelEdit={handleCancelEdit}
            />
          </div>
        </div>
      )}
    </div>
  )
}
