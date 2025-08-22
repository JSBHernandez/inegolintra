'use client'

import { useState } from 'react'
import Image from 'next/image'
import ClientCaseForm from '@/components/ClientCaseForm'
import ClientCasesList from '@/components/ClientCasesList'
import LoginForm from '@/components/LoginForm'
import { useAuth } from '@/hooks/useAuth'
import { ClientCase } from '@/types'

export default function Home() {
  const { isAuthenticated, isLoading, login, logout } = useAuth()
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

  const handleLogout = async () => {
    await logout()
    setEditingCase(null)
    setRefreshTrigger(0)
    setShowFormModal(false)
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={login} />
  }

  // Show main application if authenticated
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
          {/* Desktop Layout */}
          <div className="hidden lg:flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div>
                <Image
                  src="/LOGO-CABEZALN-PNG.png"
                  alt="Inegol Law Logo"
                  width={150}
                  height={60}
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Client Portal</h1>
                <p className="mt-1 text-gray-600">Manage immigration cases and client contracts efficiently</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowFormModal(true)}
                className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors font-medium"
              >
                + Register New Client Case
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden">
            {/* First Row: Logo and Logout Button */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex-shrink-0">
                <Image
                  src="/LOGO-CABEZALN-PNG.png"
                  alt="Inegol Law Logo"
                  width={120}
                  height={48}
                  className="object-contain"
                  priority
                />
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors text-sm"
              >
                Logout
              </button>
            </div>
            
            {/* Second Row: Title and Description */}
            <div className="mb-4">
              <h1 className="text-xl font-bold text-gray-900">Client Portal</h1>
              <p className="mt-1 text-sm text-gray-600">Manage immigration cases and client contracts efficiently</p>
            </div>
            
            {/* Third Row: Register Button (Full Width) */}
            <div>
              <button
                onClick={() => setShowFormModal(true)}
                className="w-full bg-orange-600 text-white px-4 py-3 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors font-medium"
              >
                + Register New Client Case
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClientCasesList 
          refreshTrigger={refreshTrigger}
          onEdit={handleEditCase}
        />
      </main>

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