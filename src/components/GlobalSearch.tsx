'use client'

import { useState, useEffect, useCallback } from 'react'
import { AuthUser } from '@/types'

interface SearchResult {
  id: number
  type: 'case' | 'user' | 'training' | 'permission' | 'incident'
  title: string
  description: string
  url: string
  metadata?: Record<string, unknown>
}

interface GlobalSearchProps {
  user: AuthUser
}

export default function GlobalSearch({ user: _user }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searchType, setSearchType] = useState<string>('all')
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches')
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches))
    }
  }, [])

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: searchQuery,
          type: searchType === 'all' ? undefined : searchType
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setResults(result.data)
          
          // Save to recent searches
          const updatedSearches = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5)
          setRecentSearches(updatedSearches)
          localStorage.setItem('recentSearches', JSON.stringify(updatedSearches))
        }
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }, [searchType, recentSearches])

  const debouncedSearch = useCallback(
    debounce((q: string) => performSearch(q), 300),
    [performSearch]
  )

  // Trigger search when query changes
  useEffect(() => {
    debouncedSearch(query)
  }, [query, debouncedSearch])

  const handleSearchTypeChange = (type: string) => {
    setSearchType(type)
    if (query.trim()) {
      debouncedSearch(query)
    }
  }

  const getResultIcon = (type: string) => {
    const icons: Record<string, string> = {
      case: '📋',
      user: '👤',
      training: '📚',
      permission: '📝',
      incident: '⚠️',
    }
    return icons[type] || '📄'
  }

  const getResultTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      case: 'Client Case',
      user: 'User',
      training: 'Training Module',
      permission: 'Permission Request',
      incident: 'Incident Report',
    }
    return labels[type] || 'Unknown'
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Global Search</h2>
          <p className="text-gray-600">Search across all modules and data</p>
        </div>
      </div>

      {/* Search Interface */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        {/* Search Input */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
            placeholder="Search for cases, users, training modules, permissions, incidents..."
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
            </div>
          )}
        </div>

        {/* Search Type Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { value: 'all', label: 'All' },
            { value: 'case', label: 'Cases' },
            { value: 'user', label: 'Users' },
            { value: 'training', label: 'Training' },
            { value: 'permission', label: 'Permissions' },
            { value: 'incident', label: 'Incidents' },
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => handleSearchTypeChange(type.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                searchType === type.value
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && query.trim() === '' && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-900">Recent Searches</h3>
              <button
                onClick={clearRecentSearches}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(search)}
                  className="px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-sm hover:bg-gray-100 transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {query.trim().length > 0 && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Search Results {results.length > 0 && `(${results.length})`}
            </h3>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Searching...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.821-5.879-2.17M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try different keywords or check your spelling.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      if (result.url.startsWith('http')) {
                        window.open(result.url, '_blank')
                      } else {
                        window.location.href = result.url
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{getResultIcon(result.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-lg font-medium text-gray-900 truncate">
                            {result.title}
                          </h4>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                            {getResultTypeLabel(result.type)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {result.description}
                        </p>
                        {result.metadata && (
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(result.metadata).map(([key, value]) => (
                              <span
                                key={key}
                                className="inline-flex px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
                              >
                                {key}: {String(value)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Tips */}
      {query.trim().length === 0 && (
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Search Tips</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Basic Search:</h4>
              <ul className="space-y-1">
                <li>• Type at least 2 characters to start searching</li>
                <li>• Use quotation marks for exact phrases</li>
                <li>• Search is case-insensitive</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Advanced Tips:</h4>
              <ul className="space-y-1">
                <li>• Use filters to narrow down results</li>
                <li>• Search by client name, case ID, or keywords</li>
                <li>• Recent searches are saved for quick access</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Debounce utility function
function debounce(func: (query: string) => void, wait: number) {
  let timeout: NodeJS.Timeout
  return (query: string) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(query), wait)
  }
}
