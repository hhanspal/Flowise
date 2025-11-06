import React, { useState, useEffect, ChangeEvent } from 'react'

interface MarketplaceWorkflow {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  author: string
  version: string
  rating: number
  downloads: number
  isPublic: boolean
  price?: number
  thumbnail?: string
  createdAt: string
  updatedAt: string
}

interface MarketplaceBrowserProps {
  onInstall: (workflow: MarketplaceWorkflow) => Promise<void>
  onViewDetails: (workflow: MarketplaceWorkflow) => void
}

const MarketplaceBrowser: React.FC<MarketplaceBrowserProps> = ({
  onInstall,
  onViewDetails
}) => {
  const [workflows, setWorkflows] = useState<MarketplaceWorkflow[]>([])
  const [filteredWorkflows, setFilteredWorkflows] = useState<MarketplaceWorkflow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('downloads')
  const [installingIds, setInstallingIds] = useState<Set<string>>(new Set())

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'automation', label: 'Business Automation' },
    { value: 'ai-agents', label: 'AI Agents' },
    { value: 'data-analysis', label: 'Data Analysis' },
    { value: 'customer-support', label: 'Customer Support' },
    { value: 'sales', label: 'Sales & Marketing' },
    { value: 'devops', label: 'DevOps & IT' },
    { value: 'integration', label: 'API Integration' },
    { value: 'other', label: 'Other' }
  ]

  const sortOptions = [
    { value: 'downloads', label: 'Most Downloaded' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'recent', label: 'Recently Updated' },
    { value: 'name', label: 'Name (A-Z)' }
  ]

  useEffect(() => {
    fetchMarketplaceWorkflows()
  }, [])

  useEffect(() => {
    filterAndSortWorkflows()
  }, [workflows, searchTerm, selectedCategory, sortBy])

  const fetchMarketplaceWorkflows = async () => {
    try {
      // In a real implementation, this would fetch from an API
      // For now, we'll simulate with mock data
      const mockWorkflows: MarketplaceWorkflow[] = [
        {
          id: '1',
          name: 'Customer Support Automation',
          description: 'Automated customer support workflow with AI agents and ticketing integration',
          category: 'customer-support',
          tags: ['support', 'automation', 'ai'],
          author: 'AgentFlowOS Team',
          version: '1.2.0',
          rating: 4.8,
          downloads: 1250,
          isPublic: true,
          price: 0,
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-20T00:00:00Z'
        },
        {
          id: '2',
          name: 'Sales Lead Qualification',
          description: 'AI-powered sales lead qualification and scoring system',
          category: 'sales',
          tags: ['sales', 'leads', 'qualification'],
          author: 'SalesPro Inc',
          version: '2.1.0',
          rating: 4.6,
          downloads: 890,
          isPublic: true,
          price: 29.99,
          createdAt: '2024-01-10T00:00:00Z',
          updatedAt: '2024-01-18T00:00:00Z'
        },
        {
          id: '3',
          name: 'DevOps CI/CD Pipeline',
          description: 'Complete CI/CD automation with testing, deployment, and monitoring',
          category: 'devops',
          tags: ['devops', 'ci-cd', 'automation'],
          author: 'DevOps Guru',
          version: '1.0.5',
          rating: 4.9,
          downloads: 2100,
          isPublic: true,
          price: 0,
          createdAt: '2024-01-05T00:00:00Z',
          updatedAt: '2024-01-22T00:00:00Z'
        }
      ]

      setWorkflows(mockWorkflows)
    } catch (error) {
      console.error('Error fetching marketplace workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortWorkflows = () => {
    let filtered = workflows.filter(workflow => {
      const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          workflow.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          workflow.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCategory = selectedCategory === 'all' || workflow.category === selectedCategory

      return matchesSearch && matchesCategory
    })

    // Sort workflows
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'downloads':
          return b.downloads - a.downloads
        case 'rating':
          return b.rating - a.rating
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    setFilteredWorkflows(filtered)
  }

  const handleInstall = async (workflow: MarketplaceWorkflow) => {
    setInstallingIds(prev => new Set(prev).add(workflow.id))

    try {
      await onInstall(workflow)
    } catch (error) {
      console.error('Error installing workflow:', error)
    } finally {
      setInstallingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(workflow.id)
        return newSet
      })
    }
  }

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return 'Free'
    return `$${price.toFixed(2)}`
  }

  const formatDownloads = (downloads: number) => {
    if (downloads >= 1000) {
      return `${(downloads / 1000).toFixed(1)}k`
    }
    return downloads.toString()
  }

  if (loading) {
    return (
      <div className="marketplace-browser">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="marketplace-browser">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">AgentFlowOS Marketplace</h2>
        <p className="text-gray-600">
          Discover and install pre-built workflows created by the community
        </p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Workflow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkflows.map(workflow => (
          <div key={workflow.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold line-clamp-2">{workflow.name}</h3>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${workflow.price ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                  {formatPrice(workflow.price)}
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">{workflow.description}</p>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {/* Metadata */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>by {workflow.author}</span>
                  <span>v{workflow.version}</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {workflow.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-800">
                      {tag}
                    </span>
                  ))}
                  {workflow.tags.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-800">
                      +{workflow.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <span className="text-yellow-500 mr-1">★</span>
                      {workflow.rating}
                    </span>
                    <span className="flex items-center">
                      <span className="text-gray-500 mr-1">↓</span>
                      {formatDownloads(workflow.downloads)}
                    </span>
                  </div>
                  <span className="text-gray-500">
                    {new Date(workflow.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => onViewDetails(workflow)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleInstall(workflow)}
                    disabled={installingIds.has(workflow.id)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {installingIds.has(workflow.id) ? 'Installing...' : 'Install'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredWorkflows.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
          <p className="text-gray-500">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  )
}

export default MarketplaceBrowser