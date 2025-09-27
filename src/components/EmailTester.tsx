'use client'

import { useState } from 'react'

export default function EmailTester() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')

  const testEmail = async (emailType: string) => {
    if (!recipientEmail || !recipientName) {
      setMessage('Please fill in recipient email and name')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailType,
          recipientEmail,
          recipientName
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        setMessage(`✅ ${result.message}`)
        console.log('Email config:', result.config)
      } else {
        setMessage(`❌ Error: ${result.error}`)
        if (result.details) {
          console.error('Details:', result.details)
        }
      }
    } catch (error) {
      setMessage('❌ Connection error')
      console.error('Test email error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">🧪 Email Configuration Tester</h3>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Email
          </label>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="test@example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Name
          </label>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="John Doe"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <button
          onClick={() => testEmail('welcome')}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '⏳' : '📧'} Test Welcome Email
        </button>
        
        <button
          onClick={() => testEmail('permission-approved')}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? '⏳' : '✅'} Test Approval Email
        </button>
        
        <button
          onClick={() => testEmail('permission-rejected')}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? '⏳' : '❌'} Test Rejection Email
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('✅') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600">
        <h4 className="font-medium mb-2">Current Configuration:</h4>
        <ul className="space-y-1">
          <li><strong>SMTP Host:</strong> smtp.hostinger.com</li>
          <li><strong>SMTP User:</strong> log@inegollaw.com</li>
          <li><strong>App URL:</strong> https://inegolintra.vercel.app/</li>
        </ul>
      </div>
    </div>
  )
}