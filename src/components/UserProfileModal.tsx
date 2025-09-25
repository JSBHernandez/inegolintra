'use client'

import { useState } from 'react'
import { User } from '@/types'
import { countryOptions } from '@/lib/validations'
import UserFiles from './UserFiles'

interface UserProfileModalProps {
  user: User
  isOpen: boolean
  onClose: () => void
  onUserUpdate: (user: User) => void
  onUserDelete: (userId: string) => void
}

interface ProfileForm {
  address: string
  country: string
  personalPhone: string
  emergencyPhone: string
  emergencyContactName: string
  profilePhoto: string
}

export default function UserProfileModal({ 
  user, 
  isOpen, 
  onClose, 
  onUserUpdate, 
  onUserDelete 
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'files'>('profile')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    address: user.address || '',
    country: user.country || '',
    personalPhone: user.personalPhone || '',
    emergencyPhone: user.emergencyPhone || '',
    emergencyContactName: user.emergencyContactName || '',
    profilePhoto: user.profilePhoto || ''
  })

  // Profile photo states
  const [_photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [_photoUploading, _setPhotoUploading] = useState(false)

  const resetMessages = () => {
    setProfileMessage('')
    setProfileError('')
  }

  const handleCloseModal = () => {
    setIsEditingProfile(false)
    setShowDeleteConfirm(false)
    setActiveTab('profile')
    resetMessages()
    onClose()
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setProfileError('Photo size must be less than 5MB')
        return
      }

      setPhotoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        setPhotoPreview(base64)
        setProfileForm({ ...profileForm, profilePhoto: base64 })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessages()
    setProfileLoading(true)

    try {
      console.log('UserProfileModal sending data:', {
        userId: user.id,
        profileForm,
        address: profileForm.address,
        country: profileForm.country
      })

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileForm),
      })

      const data = await response.json()
      console.log('UserProfileModal response:', { response: response.ok, data })

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setProfileMessage('Profile updated successfully!')
      setIsEditingProfile(false)
      
      // Call the callback with the updated user data
      if (data.data && onUserUpdate) {
        onUserUpdate(data.data)
      }
      
      // Also close modal after successful update
      setTimeout(() => {
        handleCloseModal()
      }, 1500)
      
      // Clear success message after 3 seconds
      setTimeout(() => setProfileMessage(''), 3000)
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete user')
      }

      onUserDelete(user.id.toString())
      handleCloseModal()
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to delete user')
      setShowDeleteConfirm(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {/* Profile Photo */}
            <div className="flex-shrink-0 h-16 w-16">
              {user.profilePhoto ? (
                <img 
                  src={photoPreview || user.profilePhoto} 
                  alt={user.name}
                  className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-xl">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
              <p className="text-sm text-gray-500">{user.position}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

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

        {/* Modal Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
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

          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Basic Information Card */}
              <div className="bg-gray-50 rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="p-3 bg-white border border-gray-200 rounded-md">
                      {user.name}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position/Role
                    </label>
                    <div className="p-3 bg-white border border-gray-200 rounded-md">
                      {user.position}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="p-3 bg-white border border-gray-200 rounded-md">
                      {user.email}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      System Role
                    </label>
                    <div className="p-3 bg-white border border-gray-200 rounded-md">
                      {user.role === 'ADMIN' ? 'Administrator' : 'Agent'}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Account Status</h4>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm text-gray-600">{user.isActive ? 'Active Account' : 'Inactive Account'}</span>
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

              {/* Additional Profile Information Card */}
              <div className="bg-gray-50 rounded-lg border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Additional Profile Information</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        isEditingProfile
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Delete User
                    </button>
                  </div>
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    {/* Profile Photo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profile Photo
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
                          {photoPreview || user.profilePhoto ? (
                            <img 
                              src={photoPreview || user.profilePhoto} 
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        <input
                          type="text"
                          value={profileForm.address}
                          onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter your address"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <select
                          value={profileForm.country}
                          onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select a country</option>
                          {countryOptions.map((country) => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Personal Phone
                        </label>
                        <input
                          type="tel"
                          value={profileForm.personalPhone}
                          onChange={(e) => setProfileForm({ ...profileForm, personalPhone: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter your phone number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Emergency Contact Name
                        </label>
                        <input
                          type="text"
                          value={profileForm.emergencyContactName}
                          onChange={(e) => setProfileForm({ ...profileForm, emergencyContactName: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Emergency contact full name"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Emergency Contact Phone
                        </label>
                        <input
                          type="tel"
                          value={profileForm.emergencyPhone}
                          onChange={(e) => setProfileForm({ ...profileForm, emergencyPhone: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Emergency contact phone number"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {profileLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <div className="p-3 bg-white border border-gray-200 rounded-md">
                        {user.address || 'Not provided'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <div className="p-3 bg-white border border-gray-200 rounded-md">
                        {user.country || 'Not provided'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Personal Phone
                      </label>
                      <div className="p-3 bg-white border border-gray-200 rounded-md">
                        {user.personalPhone || 'Not provided'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Emergency Contact
                      </label>
                      <div className="p-3 bg-white border border-gray-200 rounded-md">
                        {user.emergencyContactName ? (
                          <div>
                            <div className="font-medium">{user.emergencyContactName}</div>
                            {user.emergencyPhone && (
                              <div className="text-sm text-gray-600">{user.emergencyPhone}</div>
                            )}
                          </div>
                        ) : (
                          'Not provided'
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <UserFiles user={user} />
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm User Deletion</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{user.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}