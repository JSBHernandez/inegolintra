'use client'

import { useState, useEffect } from 'react'
import { AuthUser } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // First try to get current user info
      const response = await fetch('/api/me')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.user) {
          setUser(result.user)
          setIsAuthenticated(true)
        } else {
          // Check legacy admin auth by trying client-cases endpoint
          const legacyResponse = await fetch('/api/client-cases')
          setIsAuthenticated(legacyResponse.ok)
          if (legacyResponse.ok) {
            // Set a mock legacy admin user
            setUser({
              id: 0,
              email: 'admin',
              name: 'Administrator',
              position: 'System Admin',
              role: 'ADMIN',
              mustChangePassword: false
            })
          }
        }
      } else {
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch {
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = (userData?: AuthUser) => {
    if (userData) {
      setUser(userData)
    }
    setIsAuthenticated(true)
  }

  const logout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'DELETE',
      })
    } catch {
      // Handle error silently
    }
    setIsAuthenticated(false)
    setUser(null)
  }

  const updateUser = (updatedUser: AuthUser) => {
    setUser(updatedUser)
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    checkAuthStatus,
  }
}
