'use client'

import { useState } from 'react'
import { AuthUser } from '@/types'
import { countryOptions } from '@/lib/validations'
import UserFiles from './UserFiles'

interface MyProfileProps {
  user: AuthUser
  onPasswordChanged?: () => void
}

interface PasswordChangeForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface ProfileForm {
  address: string
  country: string
  personalPhone: string
  emergencyPhone: string
  emergencyContactName: string
  profilePhoto: string
}

export default function MyProfile({ user, onPasswordChanged }: MyProfileProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'files'>('profile')
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    address: user.address || '',
    country: user.country || '',
    personalPhone: user.personalPhone || '',
    emergencyPhone: user.emergencyPhone || '',
    emergencyContactName: user.emergencyContactName || '',
    profilePhoto: user.profilePhoto || ''
  })

  // Profile photo states
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)

  const resetMessages = () => {
    setMessage('')
    setError('')
    setProfileMessage('')
    setProfileError('')
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessages()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 5) {
      setError('New password must be at least 5 characters long')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Password changed successfully!')
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setShowPasswordChange(false)
        if (onPasswordChanged) {
          onPasswordChanged()
        }
      } else {
        setError(data.error || 'Failed to change password')
      }
    } catch (error) {
      setError('An error occurred while changing password')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setProfileError('Profile photo must be less than 5MB')
        return
      }

      if (!file.type.startsWith('image/')) {
        setProfileError('Please select a valid image file')
        return
      }

      setPhotoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileSave = async () => {
    resetMessages()
    setProfileLoading(true)

    try {
      let photoUrl = profileForm.profilePhoto

      // Upload photo if a new one was selected
      if (photoFile) {
        setPhotoUploading(true)
        const photoFormData = new FormData()
        photoFormData.append('file', photoFile)
        photoFormData.append('type', 'profile')

        const photoResponse = await fetch('/api/upload', {
          method: 'POST',
          body: photoFormData,
        })

        const photoData = await photoResponse.json()

        if (photoResponse.ok) {
          photoUrl = photoData.url
        } else {
          throw new Error(photoData.error || 'Failed to upload photo')
        }
        setPhotoUploading(false)
      }

      // Update profile
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...profileForm,
          profilePhoto: photoUrl
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setProfileMessage('Profile updated successfully!')
        setIsEditingProfile(false)
        setPhotoFile(null)
        setPhotoPreview(null)
        // Update form with the new data
        setProfileForm(prev => ({ ...prev, profilePhoto: photoUrl }))
      } else {
        setProfileError(data.error || 'Failed to update profile')
      }
    } catch (error) {
      setProfileError('An error occurred while updating profile')
    } finally {
      setProfileLoading(false)
      setPhotoUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'files'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Files
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Basic Information Card */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
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

              {/* Profile Information Card */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Additional Profile Information</h3>
                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                {/* Messages */}
                {profileMessage && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-700">{profileMessage}</p>
                  </div>
                )}

                {profileError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700">{profileError}</p>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Profile Photo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Profile Photo
                    </label>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-gray-200 rounded-full overflow-hidden border-2 border-gray-300">
                          {photoPreview || profileForm.profilePhoto ? (
                            <img
                              src={photoPreview || profileForm.profilePhoto}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <span className="text-2xl">👤</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {isEditingProfile && (
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Upload a photo (max 5MB, JPG/PNG)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Address */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      {isEditingProfile ? (
                        <textarea
                          value={profileForm.address}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                          placeholder="Enter your full address"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md min-h-[80px]">
                          {profileForm.address || 'No address provided'}
                        </div>
                      )}
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      {isEditingProfile ? (
                        <select
                          value={profileForm.country}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, country: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select a country</option>
                          {countryOptions.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                          {profileForm.country || 'No country provided'}
                        </div>
                      )}
                    </div>

                    {/* Personal Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Personal Phone
                      </label>
                      {isEditingProfile ? (
                        <input
                          type="tel"
                          value={profileForm.personalPhone}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, personalPhone: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter your personal phone number"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                          {profileForm.personalPhone || 'No phone provided'}
                        </div>
                      )}
                    </div>

                    {/* Emergency Contact Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Emergency Contact Name
                      </label>
                      {isEditingProfile ? (
                        <input
                          type="text"
                          value={profileForm.emergencyContactName}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter emergency contact name"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                          {profileForm.emergencyContactName || 'No emergency contact provided'}
                        </div>
                      )}
                    </div>

                    {/* Emergency Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Emergency Contact Phone
                      </label>
                      {isEditingProfile ? (
                        <input
                          type="tel"
                          value={profileForm.emergencyPhone}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter emergency contact phone"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                          {profileForm.emergencyPhone || 'No emergency phone provided'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Save Button */}
                  {isEditingProfile && (
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingProfile(false)
                          setPhotoFile(null)
                          setPhotoPreview(null)
                          resetMessages()
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleProfileSave}
                        disabled={profileLoading || photoUploading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {profileLoading || photoUploading ? 'Saving...' : 'Save Profile'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Password Change Card */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Security</h3>
                  <button
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    {showPasswordChange ? 'Cancel' : 'Change Password'}
                  </button>
                </div>

                {/* Messages */}
                {message && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-700">{message}</p>
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {showPasswordChange && (
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full p-3 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full p-3 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                          minLength={5}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Password must be at least 5 characters long
                      </p>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full p-3 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                          minLength={5}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordChange(false)
                          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                          resetMessages()
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>
                  </form>
                )}

                {!showPasswordChange && (
                  <div className="text-center py-8">
                    <div className="text-2xl font-bold text-blue-600">
                      {user.role === 'ADMIN' ? 'Full' : 'Limited'}
                    </div>
                    <div className="text-sm text-gray-600">Access Level</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <UserFiles user={user} />
          )}
        </div>
      </div>
    </div>
  )
}