'use client'

import { useState, useEffect } from 'react'
import { AuthUser } from '@/types'

interface MyProfileProps {
  user: AuthUser
  onPasswordChanged?: () => void
}

interface PasswordChangeForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function MyProfile({ user, onPasswordChanged }: MyProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [profileData, setProfileData] = useState({
    name: user.name,
    position: user.position,
    email: user.email
  })

  // Password validation functions
  const getPasswordRequirements = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[^A-Za-z0-9]/.test(password),
    }
  }

  const passwordRequirements = getPasswordRequirements(passwordForm.newPassword)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password requirements
    const requirements = getPasswordRequirements(passwordForm.newPassword)
    if (!requirements.minLength) {
      setError('Password must be at least 8 characters long')
      return
    }
    if (!requirements.hasUppercase) {
      setError('Password must contain at least one uppercase letter')
      return
    }
    if (!requirements.hasLowercase) {
      setError('Password must contain at least one lowercase letter')
      return
    }
    if (!requirements.hasNumber) {
      setError('Password must contain at least one number')
      return
    }
    if (!requirements.hasSpecialChar) {
      setError('Password must contain at least one special character')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setMessage('Password updated successfully')
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setShowPasswordChange(false)
        onPasswordChanged?.()
      } else {
        setError(result.error || 'Error changing password')
      }
    } catch (error) {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Eye icon component for show/hide password
  const EyeIcon = ({ show, onClick }: { show: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
    >
      {show ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
            <p className="text-gray-600">Manage your personal information and account settings</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${ 
              user.role === 'ADMIN' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {user.role === 'ADMIN' ? 'Administrator' : 'Agent'}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              {user.name}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position/Role
            </label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              {user.position}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              {user.email}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              System Role
            </label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              {user.role === 'ADMIN' ? 'Administrator' : 'Agent'}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">Account Status</h4>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Active Account</span>
            </div>
            {user.mustChangePassword && (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                <span className="text-sm text-orange-600">Password change required</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-4 border-b border-gray-200">
            <div>
              <h4 className="text-md font-medium text-gray-900">Password</h4>
              <p className="text-sm text-gray-600">
                Change your password to keep your account secure
              </p>
            </div>
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
            >
              Change Password
            </button>
          </div>
        </div>

        {/* Password Change Form */}
        {showPasswordChange && (
          <div className="mt-6 p-6 bg-gray-50 rounded-lg border">
            <h4 className="text-md font-medium text-gray-900 mb-4">Change Password</h4>
            
            {/* Messages within password change form */}
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
                {message}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({
                      ...prev,
                      currentPassword: e.target.value
                    }))}
                    className="w-full p-3 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                  <EyeIcon 
                    show={showCurrentPassword} 
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                    className="w-full p-3 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    minLength={8}
                    required
                  />
                  <EyeIcon 
                    show={showNewPassword} 
                    onClick={() => setShowNewPassword(!showNewPassword)} 
                  />
                </div>
                
                {/* Password Requirements Indicator */}
                {passwordForm.newPassword && (
                  <div className="mt-3 p-3 bg-gray-100 rounded-md">
                    <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                    <div className="space-y-1">
                      <div className={`flex items-center text-xs ${passwordRequirements.minLength ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="mr-2">{passwordRequirements.minLength ? '✓' : '✗'}</span>
                        At least 8 characters
                      </div>
                      <div className={`flex items-center text-xs ${passwordRequirements.hasUppercase ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="mr-2">{passwordRequirements.hasUppercase ? '✓' : '✗'}</span>
                        One uppercase letter (A-Z)
                      </div>
                      <div className={`flex items-center text-xs ${passwordRequirements.hasLowercase ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="mr-2">{passwordRequirements.hasLowercase ? '✓' : '✗'}</span>
                        One lowercase letter (a-z)
                      </div>
                      <div className={`flex items-center text-xs ${passwordRequirements.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="mr-2">{passwordRequirements.hasNumber ? '✓' : '✗'}</span>
                        One number (0-9)
                      </div>
                      <div className={`flex items-center text-xs ${passwordRequirements.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="mr-2">{passwordRequirements.hasSpecialChar ? '✓' : '✗'}</span>
                        One special character (!@#$%^&*()_+-=[]{}|;:,.)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({
                      ...prev,
                      confirmPassword: e.target.value
                    }))}
                    className="w-full p-3 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                  <EyeIcon 
                    show={showConfirmPassword} 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordChange(false)
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    })
                    setError('')
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Account Statistics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Statistics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {new Date().toLocaleDateString('en-US')}
            </div>
            <div className="text-sm text-gray-600">Last Access</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">Active</div>
            <div className="text-sm text-gray-600">Account Status</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {user.role === 'ADMIN' ? 'Full' : 'Limited'}
            </div>
            <div className="text-sm text-gray-600">Access Level</div>
          </div>
        </div>
      </div>
    </div>
  )
}
