'use client'

import { useState } from 'react'
import { AuthUser } from '@/types'
import { countryOptions } from '@/lib/validations'
import UserFiles from './UserFiles'
import { useEffect } from 'react'

interface MyProfileProps {
  user: AuthUser
  onPasswordChanged?: () => void
  onProfileUpdated?: (updatedUser: AuthUser) => void
  onUserDataRefresh?: () => Promise<void>
}

interface PasswordChangeForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface ProfileForm {
  name: string
  position: string
  address: string
  country: string
  personalPhone: string
  emergencyPhone: string
  emergencyContactName: string
  profilePhoto: string
}

export default function MyProfile({ user, onPasswordChanged, onProfileUpdated, onUserDataRefresh }: MyProfileProps) {
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
    name: user.name || '',
    position: user.position || '',
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
  const [imageKey, setImageKey] = useState<number>(Date.now()) // For forcing image refresh
  const [imageUrl, setImageUrl] = useState<string>('') // Direct image URL from server

  const resetMessages = () => {
    setMessage('')
    setError('')
    setProfileMessage('')
    setProfileError('')
  }

  // Function to fetch image directly as data URL
  const fetchImageDirectly = async (url: string) => {
    if (!url || !url.startsWith('/api/files/')) {
      return url
    }
    
    try {
      const response = await fetch(`${url}?direct=true`)
      
      if (response.ok) {
        const result = await response.json()
        
        if (result.success && result.dataUrl) {
          // Validate the data URL format
          const isValidDataUrl = result.dataUrl.startsWith('data:image/') && result.dataUrl.includes('base64,')
          
          if (isValidDataUrl) {
            console.log('Successfully loaded image data URL, length:', result.dataUrl.length)
            return result.dataUrl
          } else {
            console.warn('Invalid data URL format received')
          }
        }
      } else {
        console.warn('Direct fetch failed with status:', response.status)
      }
    } catch (error) {
      console.error('Error fetching image directly:', error)
    }
    
    // Fallback to original URL with cache buster
    return `${url}?t=${imageKey}`
  }

  // Initialize image URL when component loads
  useEffect(() => {
    const initializeImage = async () => {
      if (profileForm.profilePhoto) {
        if (profileForm.profilePhoto.startsWith('/api/files/')) {
          const directUrl = await fetchImageDirectly(profileForm.profilePhoto)
          setImageUrl(directUrl)
        } else {
          setImageUrl(profileForm.profilePhoto)
        }
      } else {
        setImageUrl('')
      }
    }
    
    initializeImage()
  }, [profileForm.profilePhoto, imageKey])

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
    } catch (_error) {
      setError('An error occurred while changing password')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit for deployment
        setProfileError('Profile photo must be less than 2MB for deployment compatibility')
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
      console.log('Profile update response:', { response: response.ok, data })

      if (response.ok && data.success) {
        setProfileMessage('Profile updated successfully!')
        setIsEditingProfile(false)
        setPhotoFile(null)
        setPhotoPreview(null)
        setImageKey(Date.now()) // Force image refresh
        
        // Update local form with the new data
        if (data.data) {
          const newProfileData = {
            name: data.data.name || '',
            position: data.data.position || '',
            address: data.data.address || '',
            country: data.data.country || '',
            personalPhone: data.data.personalPhone || '',
            emergencyPhone: data.data.emergencyPhone || '',
            emergencyContactName: data.data.emergencyContactName || '',
            profilePhoto: data.data.profilePhoto || ''
          }
          
          setProfileForm(newProfileData)
          
          // Fetch the image directly if it's from our API
          if (newProfileData.profilePhoto && newProfileData.profilePhoto.startsWith('/api/files/')) {
            fetchImageDirectly(newProfileData.profilePhoto).then(directUrl => {
              setImageUrl(directUrl)
            })
          } else {
            setImageUrl(newProfileData.profilePhoto)
          }
          
          // Notify parent component about the update only if we have valid data
          if (onProfileUpdated && data.data.id) {
            onProfileUpdated(data.data)
          }
          
          // Trigger a full user data refresh if available
          if (onUserDataRefresh) {
            await onUserDataRefresh()
          }
        } else {
          // If no data returned, just update the photo URL in the form
          setProfileForm(prev => ({ ...prev, profilePhoto: photoUrl }))
        }
      } else {
        setProfileError(data.error || 'Failed to update profile')
      }
    } catch (_error) {
      setProfileError('An error occurred while updating profile')
    } finally {
      setProfileLoading(false)
      setPhotoUploading(false)
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              My Profile
            </h1>
            <p className="text-gray-600">
              Manage your personal information and account settings
            </p>
          </div>
        </div>
      </div>

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
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter full name"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                        {user.name}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position/Role
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={profileForm.position}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, position: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter position/role"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                        {user.position}
                      </div>
                    )}
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
                          {photoPreview ? (
                            <img
                              key={`preview-${imageKey}`}
                              src={photoPreview}
                              alt="Profile Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : imageUrl ? (
                            <img
                              key={`image-${imageKey}`}
                              src={imageUrl}
                              alt="Profile"
                              className="w-full h-full object-cover"
                              onError={() => {
                                console.log('Image failed to load, clearing URL')
                                setImageUrl('')
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              No Photo
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
                            className="hidden"
                            id="photo-upload"
                          />
                          <label 
                            htmlFor="photo-upload"
                            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer w-full"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Choose File
                          </label>
                          <p className="mt-1 text-xs text-gray-500">
                            Upload a photo (max 2MB, JPG/PNG - deployment optimized)
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