'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AuthUser } from '@/types'
import ClientPortal from './ClientPortal'
import UserManagement from './UserManagement'
import HumanResources from './HumanResources'
import TrainingModules from './TrainingModules'
import GlobalSearch from './GlobalSearch'

interface DashboardProps {
  user: AuthUser | null
  onLogout: () => void
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeModule, setActiveModule] = useState<string>('dashboard')
  const [showSearch, setShowSearch] = useState(false)

  if (!user) {
    return null
  }

  const isAdmin = user.role === 'ADMIN' || user.email === 'admin'

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', available: true },
    { id: 'client-portal', label: 'Client Portal', icon: '👥', available: isAdmin },
    { id: 'hr', label: 'Human Resources', icon: '📋', available: true },
    { id: 'training', label: 'Training', icon: '📚', available: true },
    { id: 'users', label: 'User Management', icon: '👤', available: isAdmin },
  ]

  const renderContent = () => {
    switch (activeModule) {
      case 'client-portal':
        return <ClientPortal />
      case 'users':
        return <UserManagement />
      case 'hr':
        return <HumanResources user={user} />
      case 'training':
        return <TrainingModules user={user} />
      default:
        return (
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Inegol Intranet, {user.name}
              </h2>
              <p className="text-gray-600">{user.position}</p>
              <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                <span>Role: {user.role === 'ADMIN' ? 'Administrator' : 'Agent'}</span>
                <span>•</span>
                <span>Last login: {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {isAdmin && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-md bg-blue-100">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.196-2.121M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">Client Portal</h3>
                      <p className="text-sm text-gray-600">Manage legal cases</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-md bg-green-100">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">HR Requests</h3>
                    <p className="text-sm text-gray-600">Manage permissions</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-md bg-purple-100">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Training</h3>
                    <p className="text-sm text-gray-600">Access courses</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-md bg-red-100">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.734 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Incidents</h3>
                    <p className="text-sm text-gray-600">Report issues</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">System initialized</span>
                  <span className="text-gray-400">Just now</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Welcome to Inegol Intranet</span>
                  <span className="text-gray-400">Today</span>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <Image
                src="/LOGO-CABEZALN-PNG.png"
                alt="Inegol Law Logo"
                width={120}
                height={48}
                className="object-contain"
                priority
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Inegol Intranet</h1>
                <p className="text-sm text-gray-600">Employee Portal</p>
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-4">
              {/* Search Button */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                title="Global Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* User Info */}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-600">{user.position}</p>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Global Search */}
      {showSearch && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <GlobalSearch user={user} />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {menuItems
              .filter(item => item.available)
              .map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`flex items-center space-x-2 py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeModule === item.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  )
}
