'use client'

import { useState, useEffect } from 'react'

interface ImmigrationNewsItem {
  id: string
  title: string
  date: string
  content: string
  url: string
  category: string
}

export default function ImmigrationNews() {
  const [news, setNews] = useState<ImmigrationNewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    // Mock data for now - will be replaced with USCIS API integration
    const mockNews: ImmigrationNewsItem[] = [
      {
        id: '1',
        title: 'USCIS Assists in Investigation of Two Minnesota Men Arrested for Funding and Directing Kidnappings, Bombings, and Killings Overseas',
        date: 'September 10, 2025',
        content: 'USCIS provided assistance in a federal investigation that led to the arrest of two Minnesota men...',
        url: 'https://www.uscis.gov/news',
        category: 'News Releases'
      },
      {
        id: '2',
        title: 'International Pakistani Con Man Apprehended',
        date: 'September 08, 2025',
        content: 'Federal authorities have apprehended an international con man who was operating fraudulent schemes...',
        url: 'https://www.uscis.gov/news',
        category: 'News Releases'
      },
      {
        id: '3',
        title: 'DHS Terminates 2021 Designation of Venezuela for Temporary Protected Status',
        date: 'September 05, 2025',
        content: 'The Department of Homeland Security announced the termination of the 2021 designation...',
        url: 'https://www.uscis.gov/news',
        category: 'Alerts'
      },
      {
        id: '4',
        title: 'Twelve People Charged for Their Roles in International Alien Smuggling, Asylum Fraud, and Money Laundering Conspiracies',
        date: 'September 04, 2025',
        content: 'Federal prosecutors have charged twelve individuals in connection with international alien smuggling...',
        url: 'https://www.uscis.gov/news',
        category: 'News Releases'
      }
    ]

    // Simulate API call
    const fetchNews = async () => {
      setLoading(true)
      try {
        // TODO: Replace with actual USCIS API call
        // const response = await fetch('/api/immigration-news')
        // const data = await response.json()
        
        // For now, use mock data
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate loading
        setNews(mockNews)
      } catch (err) {
        setError('Failed to fetch immigration news')
        console.error('Error fetching immigration news:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [])

  const categories = ['all', 'News Releases', 'Alerts', 'Policy Memoranda', 'Forms']

  const filteredNews = selectedCategory === 'all' 
    ? news 
    : news.filter(item => item.category === selectedCategory)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'News Releases':
        return 'bg-blue-100 text-blue-800'
      case 'Alerts':
        return 'bg-orange-100 text-orange-800'
      case 'Policy Memoranda':
        return 'bg-green-100 text-green-800'
      case 'Forms':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      {/* TEST: Full width container */}
      <div className="w-full bg-red-100 p-2 mb-4 border-2 border-red-500">
        <p className="text-red-800 font-bold">TEST: This should span the full width of the screen</p>
      </div>
      
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Immigration News
            </h1>
            <p className="text-gray-600">
              Latest updates from USCIS newsroom and immigration policy changes
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
              <p className="text-sm text-orange-700">
                <span className="font-medium">Coming Soon:</span> Direct integration with USCIS API
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Category</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'All Categories' : category}
            </button>
          ))}
        </div>
      </div>

      {/* News Content */}
      <div className="bg-white rounded-lg shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading immigration news...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{error}</p>
            <p className="text-gray-500 mt-2">Please try again later</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-600">No news found for the selected category</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNews.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(item.date)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-orange-600 transition-colors">
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                      >
                        {item.title}
                      </a>
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {item.content}
                    </p>
                    <div className="flex items-center space-x-4">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center space-x-1"
                      >
                        <span>Read Full Article</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">Future Implementation</h4>
            <p className="text-sm text-blue-700">
              This section will be integrated with the official USCIS newsroom API to provide real-time immigration news and updates. 
              Currently displaying sample data based on recent USCIS announcements.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}