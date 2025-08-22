'use client'

import { useEffect, useState } from 'react'
import CaseNotes from './CaseNotes'
import { paralegalOptions } from '@/lib/validations'

interface SafariInputStyle {
  color?: string
  opacity?: number
  WebkitTextFillColor?: string
  WebkitAppearance?: string
  backgroundColor?: string
}

interface ClientCase {
  id: number
  clientName: string
  caseType: string
  status: string
  notes?: string
  totalContract: number
  paralegal?: string
  createdAt: string
  updatedAt: string
  latestNote?: string | null
  latestNoteDate?: string | null
}

interface ClientCasesListProps {
  refreshTrigger: number
  onEdit: (clientCase: ClientCase) => void
}

export default function ClientCasesList({ refreshTrigger, onEdit }: ClientCasesListProps) {
  const [cases, setCases] = useState<ClientCase[]>([])
  const [filteredCases, setFilteredCases] = useState<ClientCase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [selectedCase, setSelectedCase] = useState<ClientCase | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [paralegalFilter, setParalegalFilter] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(30)

  const fetchCases = async () => {
    try {
      const response = await fetch('/api/client-cases')
      const result = await response.json()

      if (result.success) {
        setCases(result.data)
        setError('')
      } else {
        setError(result.error || 'Failed to fetch cases')
      }
    } catch (_) {
      setError('Failed to fetch cases')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this client case? This action cannot be undone.')) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/client-cases?id=${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setCases(cases.filter(c => c.id !== id))
      } else {
        alert(`Error deleting case: ${result.error}`)
      }
    } catch (_) {
      alert('Failed to delete case. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  // Filter cases based on status, paralegal, and search query
  useEffect(() => {
    let filtered = cases

    // Filter by status
    if (statusFilter !== 'All') {
      filtered = filtered.filter(clientCase => 
        clientCase.status === statusFilter
      )
    }

    // Filter by paralegal
    if (paralegalFilter !== 'All') {
      filtered = filtered.filter(clientCase => 
        clientCase.paralegal === paralegalFilter
      )
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(clientCase =>
        clientCase.clientName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply sorting
    const sorted = sortCases(filtered)

    setFilteredCases(sorted)
  }, [cases, statusFilter, paralegalFilter, searchQuery, sortField, sortDirection])

  // Get unique client names for suggestions
  const getClientNameSuggestions = () => {
    if (!searchQuery.trim()) return []
    
    const suggestions = cases
      .map(clientCase => clientCase.clientName)
      .filter(name => 
        name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        name.toLowerCase() !== searchQuery.toLowerCase()
      )
      .filter((name, index, arr) => arr.indexOf(name) === index) // Remove duplicates
      .slice(0, 5) // Limit to 5 suggestions
    
    return suggestions
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setShowSuggestions(value.trim().length > 0)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setShowSuggestions(false)
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      // If clicking the same field, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // If clicking a new field, set it as active and default to ascending
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortCases = (casesToSort: ClientCase[]) => {
    if (!sortField) return casesToSort

    return [...casesToSort].sort((a, b) => {
      let aValue: string | number = ''
      let bValue: string | number = ''

      switch (sortField) {
        case 'clientName':
          aValue = a.clientName.toLowerCase()
          bValue = b.clientName.toLowerCase()
          break
        case 'caseType':
          aValue = a.caseType.toLowerCase()
          bValue = b.caseType.toLowerCase()
          break
        case 'status':
          aValue = (a.status || 'Active').toLowerCase()
          bValue = (b.status || 'Active').toLowerCase()
          break
        case 'paralegal':
          aValue = (a.paralegal || '').toLowerCase()
          bValue = (b.paralegal || '').toLowerCase()
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'totalContract':
          aValue = a.totalContract || 0
          bValue = b.totalContract || 0
          break
        case 'latestNote':
          aValue = (a.latestNote || '').toLowerCase()
          bValue = (b.latestNote || '').toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1
      }
      return 0
    })
  }

  const SortableHeader = ({ field, children, className }: { field: string, children: React.ReactNode, className?: string }) => (
    <th 
      className={`px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 select-none ${className || ''}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center justify-between">
        <span>{children}</span>
        <div className="flex flex-col ml-1">
          <svg 
            className={`w-3 h-3 ${sortField === field && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <svg 
            className={`w-3 h-3 -mt-1 ${sortField === field && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </th>
  )

  // Pagination functions
  const totalPages = Math.ceil(filteredCases.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCases = filteredCases.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, paralegalFilter, searchQuery, sortField, sortDirection])

  useEffect(() => {
    fetchCases()
  }, [refreshTrigger])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
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
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="text-red-600">
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p>{error}</p>
          <button
            onClick={fetchCases}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Client Cases ({filteredCases.length})
          </h2>
          {filteredCases.length > 0 && (
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredCases.length)} of {filteredCases.length} results
            </div>
          )}
        </div>
        {/* Filters */}
        <div className="flex flex-col lg:flex-row lg:flex-wrap gap-4 lg:items-center">
          {/* Status Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Filter by Status:
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-auto"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          
          {/* Paralegal Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label htmlFor="paralegalFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Filter by Paralegal:
            </label>
            <select
              id="paralegalFilter"
              value={paralegalFilter}
              onChange={(e) => setParalegalFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-auto"
            >
              <option value="All">All</option>
              {paralegalOptions.map((paralegal) => (
                <option key={paralegal} value={paralegal}>
                  {paralegal}
                </option>
              ))}
            </select>
          </div>
          
          {/* Search by Name */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 relative flex-1 lg:flex-initial">
            <label htmlFor="nameSearch" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Search by Name:
            </label>
            <div className="relative w-full lg:w-64">
              <input
                type="text"
                id="nameSearch"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSuggestions(searchQuery.trim().length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Type client name..."
                className="px-3 py-1.5 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full"
                style={{ 
                  color: '#000000',
                  opacity: 1,
                  WebkitTextFillColor: '#000000',
                  WebkitAppearance: 'none',
                  backgroundColor: '#ffffff',
                } as React.CSSProperties & SafariInputStyle}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              {/* Suggestions dropdown */}
              {showSuggestions && getClientNameSuggestions().length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {getClientNameSuggestions().map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-3 py-2 text-left hover:bg-blue-50 hover:text-blue-700 text-sm border-b border-gray-100 last:border-b-0"
                    >
                      <span className="font-medium">
                        {suggestion.substring(0, suggestion.toLowerCase().indexOf(searchQuery.toLowerCase()))}
                      </span>
                      <span className="bg-yellow-200">
                        {suggestion.substring(
                          suggestion.toLowerCase().indexOf(searchQuery.toLowerCase()),
                          suggestion.toLowerCase().indexOf(searchQuery.toLowerCase()) + searchQuery.length
                        )}
                      </span>
                      <span className="font-medium">
                        {suggestion.substring(suggestion.toLowerCase().indexOf(searchQuery.toLowerCase()) + searchQuery.length)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {filteredCases.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <p>
            {searchQuery.trim() 
              ? `No cases found for "${searchQuery}"${statusFilter !== 'All' || paralegalFilter !== 'All' ? ` with current filters` : ''}.`
              : statusFilter === 'All' && paralegalFilter === 'All'
                ? 'No client cases registered yet.' 
                : `No cases found with current filters.`
            }
          </p>
          {(searchQuery.trim() || statusFilter !== 'All' || paralegalFilter !== 'All') && (
            <button
              onClick={() => {
                clearSearch()
                setStatusFilter('All')
                setParalegalFilter('All')
              }}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <table className="w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <SortableHeader field="clientName" className="w-48">
                    Client Name
                  </SortableHeader>
                  <SortableHeader field="caseType" className="w-52">
                    Case Type
                  </SortableHeader>
                  <SortableHeader field="status" className="w-32">
                    Status
                  </SortableHeader>
                  <SortableHeader field="totalContract" className="w-40">
                    Contract Amount
                  </SortableHeader>
                  <SortableHeader field="paralegal" className="w-40">
                    Paralegal
                  </SortableHeader>
                  <SortableHeader field="createdAt" className="w-48">
                    Created Date
                  </SortableHeader>
                  <SortableHeader field="latestNote" className="flex-1">
                    Latest Note
                  </SortableHeader>
                  <th className="w-32 px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentCases.map((clientCase) => (
                  <tr key={clientCase.id} className="hover:bg-gray-50">
                    <td className="w-48 px-6 py-6 align-top">
                      <div className="text-base font-medium text-gray-900 truncate">{clientCase.clientName}</div>
                    </td>
                    <td className="w-52 px-6 py-6 align-top">
                      <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-orange-100 text-orange-800 text-center leading-tight">
                        {clientCase.caseType}
                      </span>
                    </td>
                    <td className="w-32 px-6 py-6 align-top">
                      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap ${
                        (clientCase.status || 'Active') === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'  // For "Completed"
                      }`}>
                        {clientCase.status || 'Active'}
                      </span>
                    </td>
                    <td className="w-40 px-6 py-6 align-top">
                      <div className="text-base text-gray-900 font-semibold whitespace-nowrap">
                        {clientCase.totalContract ? formatCurrency(clientCase.totalContract) : 'N/A'}
                      </div>
                    </td>
                    <td className="w-40 px-6 py-6 align-top">
                      <div className="text-sm text-gray-900">
                        {clientCase.paralegal ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {clientCase.paralegal}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Not assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="w-48 px-6 py-6 align-top">
                      <div className="text-sm text-gray-900">
                        <div className="whitespace-nowrap">{formatDate(clientCase.createdAt)}</div>
                      </div>
                    </td>
                    <td className="flex-1 px-6 py-6 align-top">
                      <div className="text-sm text-gray-600">
                        {clientCase.latestNote ? (
                          <div>
                            <div className="mb-2 leading-relaxed break-words">{clientCase.latestNote}</div>
                            <div className="text-xs text-gray-400 whitespace-nowrap">
                              {clientCase.latestNoteDate && formatDate(clientCase.latestNoteDate)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No notes yet</span>
                        )}
                      </div>
                    </td>
                    <td className="w-32 px-6 py-6 align-top">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setSelectedCase(clientCase)}
                          className="text-green-700 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-md transition-colors text-xs font-medium w-full text-center whitespace-nowrap"
                          title="View/Add Notes"
                        >
                          Notes
                        </button>
                        <button
                          onClick={() => {
                            const caseForEdit = {
                              ...clientCase,
                              notes: clientCase.latestNote || clientCase.notes || ''
                            }
                            onEdit(caseForEdit)
                          }}
                          className="text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors text-xs font-medium w-full text-center whitespace-nowrap"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(clientCase.id)}
                          disabled={deletingId === clientCase.id}
                          className="text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium w-full text-center whitespace-nowrap"
                        >
                          {deletingId === clientCase.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden divide-y divide-gray-200 bg-gray-50">
            {currentCases.map((clientCase) => (
              <div key={clientCase.id} className="bg-white mx-4 my-4 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Card Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">{clientCase.clientName}</h3>
                    <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-orange-100 text-orange-800 whitespace-nowrap">
                      {clientCase.caseType}
                    </span>
                  </div>
                  <div className="flex justify-start">
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap ${
                      (clientCase.status || 'Active') === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'  // For "Completed"
                    }`}>
                      {clientCase.status || 'Active'}
                    </span>
                  </div>
                </div>
                
                {/* Card Content */}
                <div className="px-6 py-5">
                  <div className="grid grid-cols-2 gap-6 mb-5">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contract Amount</span>
                      <div className="text-lg font-bold text-gray-900">{clientCase.totalContract ? formatCurrency(clientCase.totalContract) : 'N/A'}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Paralegal</span>
                      <div className="text-sm font-medium text-gray-900">
                        {clientCase.paralegal ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {clientCase.paralegal}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Not assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mb-5">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created Date</span>
                      <div className="text-sm font-medium text-gray-900">{formatDate(clientCase.createdAt)}</div>
                    </div>
                  </div>

                  {/* Latest Note Section */}
                  <div className="mb-5">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-3">Latest Note</span>
                    <div className="bg-gray-50 rounded-lg p-4 min-h-[60px] flex items-center">
                      {clientCase.latestNote ? (
                        <div className="w-full">
                          <div className="text-sm text-gray-700 leading-relaxed mb-2">{clientCase.latestNote}</div>
                          {clientCase.latestNoteDate && (
                            <div className="text-xs text-gray-400">
                              {formatDate(clientCase.latestNoteDate)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic w-full text-center">No notes yet</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setSelectedCase(clientCase)}
                      className="text-green-700 hover:text-green-900 bg-green-50 hover:bg-green-100 border border-green-200 hover:border-green-300 px-4 py-2.5 rounded-lg transition-all text-sm font-medium text-center"
                      title="View/Add Notes"
                    >
                      Notes
                    </button>
                    <button
                      onClick={() => {
                        const caseForEdit = {
                          ...clientCase,
                          notes: clientCase.latestNote || clientCase.notes || ''
                        }
                        onEdit(caseForEdit)
                      }}
                      className="text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 px-4 py-2.5 rounded-lg transition-all text-sm font-medium text-center"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(clientCase.id)}
                      disabled={deletingId === clientCase.id}
                      className="text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 px-4 py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-center"
                    >
                      {deletingId === clientCase.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {filteredCases.length > itemsPerPage && (
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              {/* Mobile pagination */}
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  {/* Previous button */}
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show only a few pages around current page
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                      )
                    }
                    return null
                  })}
                  
                  {/* Next button */}
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Case Notes Modal */}
      {selectedCase && (
        <CaseNotes
          clientCaseId={selectedCase.id}
          clientName={selectedCase.clientName}
          onClose={() => setSelectedCase(null)}
          onNoteAdded={() => fetchCases()} // Refresh the cases list
        />
      )}
    </div>
  )
}
