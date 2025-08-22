'use client'

import { useState } from 'react'
import LoginForm from '@/components/LoginForm'
import Dashboard from '@/components/Dashboard'
import PasswordChangeModal from '@/components/PasswordChangeModal'
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth()
  const [showPasswordChange, setShowPasswordChange] = useState(false)

  const handleLoginSuccess = () => {
    // Login will be handled by the LoginForm component
    // Password change will be handled by the auth system
  }

  const handlePasswordChanged = () => {
    setShowPasswordChange(false)
    // Update user to remove mustChangePassword flag
    if (user) {
      login({ ...user, mustChangePassword: false })
    }
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Inegol Intranet...</p>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />
  }

  // Show main application if authenticated
  return (
    <>
      <Dashboard user={user} onLogout={logout} />
      
      {/* Password Change Modal */}
      {showPasswordChange && (
        <PasswordChangeModal
          onSuccess={handlePasswordChanged}
          onCancel={() => setShowPasswordChange(false)}
          isRequired={user?.mustChangePassword || false}
        />
      )}
    </>
  )
}