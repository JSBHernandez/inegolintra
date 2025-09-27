'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AuthUser } from '@/types'

interface WebkitStyle extends React.CSSProperties {
  WebkitTextFillColor?: string
}

interface LoginFormProps {
  onLoginSuccess: (user?: AuthUser) => void
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (result.success) {
        // Pass user data to parent component if available
        const userData = result.user ? {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          position: result.user.position,
          role: result.user.role,
          mustChangePassword: result.mustChangePassword || false
        } : undefined
        onLoginSuccess(userData)
      } else {
        setError(result.error || 'Login failed')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/LOGO-CABEZALN-PNG.png"
              alt="Inegol Law Logo"
              width={150}
              height={60}
              className="object-contain sm:w-[200px] sm:h-[80px]"
              priority
            />
          </div>
          <p className="text-lg sm:text-xl text-gray-600">Client Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500"
              placeholder="Enter your email"
              required
              style={{ 
                opacity: 1,
                WebkitTextFillColor: '#111827',
              } as WebkitStyle}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500"
              placeholder="Enter password"
              required
              style={{ 
                opacity: 1,
                WebkitTextFillColor: '#111827',
              } as WebkitStyle}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Secure access to case management system</p>
        </div>
      </div>
    </div>
  )
}
