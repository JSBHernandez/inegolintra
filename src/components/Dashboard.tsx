'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { AuthUser, News } from '@/types'
import { 
  ClientPortal,
  UserManagement,
  HumanResources,
  InteractiveTrainingModules,
  GlobalSearch,
  MyProfile,
  NewsManagement,
  ImmigrationNews
} from './index'
import EmailTester from '../../temp/EmailTester'

interface DashboardProps {
  user: AuthUser | null
  onLogout: () => void
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeModule, setActiveModule] = useState<string>('dashboard')
  const [showSearch, setShowSearch] = useState(false)
  const [news, setNews] = useState<News[]>([])
  const [loadingNews, setLoadingNews] = useState(true)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(user)

  // Update currentUser when user prop changes
  useEffect(() => {
    setCurrentUser(user)
  }, [user])

  // Function to refresh user data from server
  const refreshUserData = async () => {
    try {
      const response = await fetch('/api/me')
      const result = await response.json()
      
      if (result.success && result.user) {
        setCurrentUser(result.user)
        console.log('User data refreshed:', result.user)
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error)
    }
  }

  // Handle profile updates
  const handleProfileUpdate = async (updatedUser: AuthUser) => {
    console.log('Dashboard received profile update:', updatedUser)
    if (updatedUser && updatedUser.id) {
      // Update local state immediately
      setCurrentUser(updatedUser)
      
      // Refresh user data from server to ensure consistency
      try {
        const response = await fetch('/api/me')
        const result = await response.json()
        
        if (result.success && result.user) {
          setCurrentUser(result.user)
          console.log('User data refreshed from server:', result.user)
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error)
      }
    } else {
      console.error('Invalid user data received in profile update:', updatedUser)
    }
  }

  // Fetch active news on component mount
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news')
        const result = await response.json()
        
        if (result.success) {
          setNews(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch news:', error)
      } finally {
        setLoadingNews(false)
      }
    }

    fetchNews()
  }, [])

  if (!currentUser) {
    return null
  }

  const isAdmin = currentUser.role === 'ADMIN' || currentUser.email === 'admin'

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', available: true },
    { id: 'client-portal', label: 'Client Portal', icon: '👥', available: isAdmin },
    { id: 'news', label: 'News', icon: '📰', available: isAdmin },
    { id: 'immigration-news', label: 'Immigration News', icon: '🛂', available: true },
    { id: 'hr', label: 'Human Resources', icon: '📋', available: true },
    { id: 'training', label: 'Training', icon: '📚', available: true },
    { id: 'users', label: 'User Management', icon: '👤', available: isAdmin },
    { id: 'profile', label: 'My Profile', icon: '👨‍💼', available: true },
    // { id: 'email-tester', label: 'Email Tester', icon: '🧪', available: isAdmin }, // Hidden - debug tool
  ]

  const renderContent = () => {
    switch (activeModule) {
      case 'client-portal':
        return <ClientPortal />
      case 'news':
        return <NewsManagement user={currentUser} />
      case 'immigration-news':
        return <ImmigrationNews />
      case 'users':
        return <UserManagement />
      case 'hr':
        return <HumanResources user={currentUser} />
      case 'training':
        return <InteractiveTrainingModules user={currentUser} />
      case 'profile':
        return <MyProfile user={currentUser} onProfileUpdated={handleProfileUpdate} onUserDataRefresh={refreshUserData} />
      case 'email-tester':
        return <EmailTester />
      default:
        return (
          <div className="px-3 sm:px-6 lg:px-8">
            {/* Welcome Section */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Welcome to Inegol Intranet, {currentUser.name}
              </h2>
              <p className="text-sm sm:text-base text-gray-600">{currentUser.position}</p>
              <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-500">
                <span>Role: {currentUser.role === 'ADMIN' ? 'Administrator' : 'Agent'}</span>
                <span className="hidden sm:block">•</span>
                <span>Last login: {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* Latest News Section */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Latest News</h2>
                {isAdmin && (
                  <button
                    onClick={() => setActiveModule('news')}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium self-start sm:self-auto"
                  >
                    Manage →
                  </button>
                )}
              </div>
              
              {loadingNews ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                </div>
              ) : news.length > 0 ? (
                  <div className="space-y-4 sm:space-y-6">
                  {news.slice(0, 6).map((article) => (
                    <div key={article.id} className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border">
                      <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">{article.title}</h3>
                      <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">{article.content}</p>
                      
                      {article.imageUrl && (
                        <div className="mb-3 sm:mb-4">
                          <img 
                            src={article.imageUrl} 
                            alt={article.title}
                            className="w-1/2 max-w-sm h-auto rounded-lg object-contain shadow-sm border mx-auto sm:mx-0"
                            onError={(_e) => console.error('Dashboard image load error:', article.title)}
                            onLoad={() => console.log('Dashboard image loaded successfully:', article.title)}
                          />
                        </div>
                      )}
                      
                      <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-500">
                        <span>Published: {new Date(article.createdAt).toLocaleDateString()}</span>
                        <span className="hidden sm:block">•</span>
                        <span>By: {article.author?.name || 'Administrator'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No news articles available.</p>
              )}
              
              {news.length > 6 && (
                <div className="mt-4 sm:mt-6 text-center">
                  <button
                    onClick={() => setActiveModule('news')}
                    className="text-orange-600 hover:text-orange-700 font-medium text-sm sm:text-base"
                  >
                    View all {news.length} articles →
                  </button>
                </div>
              )}
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm flex-shrink-0">
        <div className="w-full px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            {/* Logo and Title */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <Image
                src="/LOGO-CABEZALN-PNG.png"
                alt="Inegol Law Logo"
                width={80}
                height={32}
                className="object-contain sm:w-[120px] sm:h-[48px] flex-shrink-0"
                priority
              />
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">Inegol Intranet</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Employee Portal</p>
                <p className="text-xs text-gray-600 sm:hidden">{currentUser.role}</p>
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-1 sm:space-x-4 flex-shrink-0">
              {/* Search Button */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                title="Global Search"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* User Info - Hidden on small screens */}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{currentUser.name}</p>
                <p className="text-xs text-gray-600 truncate max-w-[150px]">{currentUser.position}</p>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="bg-red-600 text-white px-2 py-1.5 sm:px-4 sm:py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors text-xs sm:text-sm font-medium"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Global Search */}
      {showSearch && (
        <div className="bg-white border-b border-gray-200 flex-shrink-0">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
            <GlobalSearch user={currentUser} />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="w-full px-3 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-8 overflow-x-auto scrollbar-hide">
            {menuItems
              .filter(item => item.available)
              .map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors flex-shrink-0 ${
                    activeModule === item.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-sm sm:text-lg">{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden text-xs">{item.label.split(' ')[0]}</span>
                </button>
              ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full py-4 sm:py-8 px-3 sm:px-0">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-orange-600 text-white py-6 sm:py-8 flex-shrink-0">
        <div className="w-full px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-xs sm:text-sm">
                © 2025 BarbaInegol Law - All rights reserved
              </p>
            </div>
            <div className="flex items-center space-x-4 sm:space-x-6">
              <button
                onClick={() => {
                  // TODO: Future implementation - redirect to Office Policy Manual subpage
                  console.log('Office Policy Manual - Coming Soon')
                }}
                className="text-orange-100 hover:text-white transition-colors text-xs sm:text-sm font-medium underline decoration-1 underline-offset-2 hover:decoration-2"
              >
                Office Policy Manual
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
