'use client'

import { useState, useEffect } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserSchema, updateUserSchema, CreateUserFormData, UpdateUserFormData } from '@/lib/validations'
import { User } from '@/types'
import UserFiles from './UserFiles'
import UserProfileModal from './UserProfileModal'

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [showUserFiles, setShowUserFiles] = useState<User | null>(null)
  const [selectedUserProfile, setSelectedUserProfile] = useState<User | null>(null)

  const createForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      name: '',
      position: '',
      role: 'AGENT'
    }
  })

  const editForm = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const result = await response.json()

      if (result.success) {
        setUsers(result.data)
      } else {
        setSubmitMessage(`Error: ${result.error}`)
      }
    } catch {
      setSubmitMessage('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser: SubmitHandler<CreateUserFormData> = async (data) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        setSubmitMessage(`User created successfully! Temporary password: ${result.temporaryPassword}`)
        createForm.reset()
        setShowCreateForm(false)
        fetchUsers()
      } else {
        setSubmitMessage(`Error: ${result.error}`)
      }
    } catch {
      setSubmitMessage('Failed to create user')
    }
  }

  const handleUpdateUser: SubmitHandler<UpdateUserFormData> = async (data) => {
    if (!editingUser) return

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingUser.id, ...data }),
      })

      const result = await response.json()

      if (result.success) {
        setSubmitMessage('User updated successfully!')
        setEditingUser(null)
        fetchUsers()
      } else {
        setSubmitMessage(`Error: ${result.error}`)
      }
    } catch {
      setSubmitMessage('Failed to update user')
    }
  }

  const _handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setSubmitMessage('User deleted successfully!')
        fetchUsers()
      } else {
        setSubmitMessage(`Error: ${result.error}`)
      }
    } catch {
      setSubmitMessage('Failed to delete user')
    }
  }

  const handleUserProfileUpdate = (updatedUser: User) => {
    console.log('UserManagement received user update:', updatedUser)
    if (updatedUser && updatedUser.id) {
      setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user))
      setSubmitMessage('User profile updated successfully!')
      setTimeout(() => setSubmitMessage(''), 3000)
    } else {
      console.error('Invalid user data received in profile update:', updatedUser)
      setSubmitMessage('Error updating user profile')
      setTimeout(() => setSubmitMessage(''), 3000)
    }
  }

  const handleUserProfileDelete = (userId: string) => {
    setUsers(users.filter(user => user.id.toString() !== userId))
    setSubmitMessage('User deleted successfully!')
    setTimeout(() => setSubmitMessage(''), 3000)
  }

  const _handleEditUser = (user: User) => {
    setEditingUser(user)
    editForm.reset({
      name: user.name,
      position: user.position,
      role: user.role,
      isActive: user.isActive,
    })
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
    <div className="px-3 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">User Management</h2>
            <p className="mt-1 text-sm sm:text-base text-gray-600">Manage system users and their roles</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={fetchUsers}
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium text-sm"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-orange-600 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors font-medium text-sm"
            >
              + Create New User
            </button>
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

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">
            System Users ({users.length})
          </h3>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Information
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role & Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {/* Profile Photo */}
                      <div className="flex-shrink-0 h-12 w-12 mr-4">
                        {user.profilePhoto ? (
                          <img 
                            src={user.profilePhoto} 
                            alt={user.name}
                            className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 font-medium text-lg">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* User Info */}
                      <div>
                        <button
                          onClick={() => setSelectedUserProfile(user)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                        >
                          {user.name}
                        </button>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">{user.position}</div>
                        {user.address && (
                          <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                            📍 {user.address}
                            {user.country && `, ${user.country}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {user.personalPhone && (
                        <div className="flex items-center mb-1">
                          <span className="text-gray-500 text-xs mr-2">📞</span>
                          <span>{user.personalPhone}</span>
                        </div>
                      )}
                      {user.emergencyContactName && (
                        <div className="text-xs text-gray-600 mt-2">
                          <div className="font-medium">Emergency Contact:</div>
                          <div>{user.emergencyContactName}</div>
                          {user.emergencyPhone && (
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-1">📞</span>
                              <span>{user.emergencyPhone}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'ADMIN' ? 'Administrator' : 'Agent'}
                      </span>
                      <br />
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <div className="text-xs text-gray-500 mt-2">
                        Last login: {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-gray-200">
          {users.map((user) => (
            <div key={user.id} className="p-4">
              <div className="flex items-start space-x-3 mb-3">
                {/* Profile Photo */}
                <div className="flex-shrink-0">
                  {user.profilePhoto ? (
                    <img 
                      src={user.profilePhoto} 
                      alt={user.name}
                      className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 font-medium text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => setSelectedUserProfile(user)}
                    className="text-base font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                  >
                    {user.name}
                  </button>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <div className="text-sm text-gray-400">{user.position}</div>
                  
                  {/* Role & Status */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Contact Info */}
                  {user.personalPhone && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="text-gray-500">📞</span> {user.personalPhone}
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setEditingUser(user)
                        editForm.reset(user)
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => setShowUserFiles(user)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      📁 Files
                    </button>
                    <button
                      onClick={() => _handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl p-4 sm:p-6 m-4 max-w-md w-full max-h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Create New User</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form onSubmit={createForm.handleSubmit(handleCreateUser)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  {...createForm.register('name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter full name"
                />
                {createForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  {...createForm.register('email')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter email address"
                />
                {createForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  {...createForm.register('position')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter job position"
                />
                {createForm.formState.errors.position && (
                  <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.position.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  {...createForm.register('role')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="AGENT">Agent</option>
                  <option value="ADMIN">Administrator</option>
                </select>
                {createForm.formState.errors.role && (
                  <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.role.message}</p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  Create User
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

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Edit User</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form onSubmit={editForm.handleSubmit(handleUpdateUser)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  {...editForm.register('name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {editForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">{editForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  {...editForm.register('position')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {editForm.formState.errors.position && (
                  <p className="mt-1 text-sm text-red-600">{editForm.formState.errors.position.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  {...editForm.register('role')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="AGENT">Agent</option>
                  <option value="ADMIN">Administrator</option>
                </select>
                {editForm.formState.errors.role && (
                  <p className="mt-1 text-sm text-red-600">{editForm.formState.errors.role.message}</p>
                )}
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...editForm.register('isActive')}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active User</span>
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  Update User
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Files Modal */}
      {showUserFiles && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                    {showUserFiles.profilePhoto ? (
                      <img
                        src={showUserFiles.profilePhoto}
                        alt={showUserFiles.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-xl">👤</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {showUserFiles.name}&apos;s Files
                    </h2>
                    <p className="text-sm text-gray-600">
                      {showUserFiles.email} • {showUserFiles.position}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUserFiles(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="max-h-[calc(90vh-80px)] overflow-y-auto">
              <UserFiles user={showUserFiles} />
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {selectedUserProfile && (
        <UserProfileModal
          user={selectedUserProfile}
          isOpen={!!selectedUserProfile}
          onClose={() => setSelectedUserProfile(null)}
          onUserUpdate={handleUserProfileUpdate}
          onUserDelete={handleUserProfileDelete}
        />
      )}
    </div>
  );
}
