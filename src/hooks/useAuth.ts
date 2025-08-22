'use client'

import { useState, useEffect } from 'react'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // Check if user is authenticated by trying to fetch data
      const response = await fetch('/api/client-cases')
      setIsAuthenticated(response.ok)
    } catch {
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const login = () => {
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
  }

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
  }
}
