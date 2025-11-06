import React, { useState, useEffect } from 'react'
import { Button, Input, TextArea, Select, Checkbox, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

interface WorkflowSubmission {
  name: string
  description: string
  category: string
  tags: string[]
  isPublic: boolean
  price?: number
  workflowData: any
  thumbnail?: string
  author: string
  version: string
}

interface MarketplaceSubmissionProps {
  workflowData: any
  onSubmit: (submission: WorkflowSubmission) => Promise<void>
  onCancel: () => void
}

const MarketplaceSubmission: React.FC<MarketplaceSubmissionProps> = ({
  workflowData,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<WorkflowSubmission>({
    name: '',
    description: '',
    category: 'automation',
    tags: [],
    isPublic: true,
    price: 0,
    workflowData,
    author: '',
    version: '1.0.0'
  })

  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const categories = [
    { value: 'automation', label: 'Business Automation' },
    { value: 'ai-agents', label: 'AI Agents' },
    { value: 'data-analysis', label: 'Data Analysis' },
    { value: 'customer-support', label: 'Customer Support' },
    { value: 'sales', label: 'Sales & Marketing' },
    { value: 'devops', label: 'DevOps & IT' },
    { value: 'integration', label: 'API Integration' },
    { value: 'other', label: 'Other' }
  ]

  useEffect(() => {
    // Auto-generate name from workflow if available
    if (workflowData?.name && !formData.name) {
      setFormData(prev => ({ ...prev, name: workflowData.name }))
    }
    if (workflowData?.description && !formData.description) {
      setFormData(prev => ({ ...prev, description: workflowData.description }))
    }
  }, [workflowData])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Workflow name is required'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    }
    if (!formData.author.trim()) {
      newErrors.author = 'Author name is required'
    }
    if (formData.price && formData.price < 0) {
      newErrors.price = 'Price cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      // Success handled by parent component
    } catch (error) {
      console.error('Submission error:', error)
      setErrors({ submit: 'Failed to submit workflow. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof WorkflowSubmission, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="marketplace-submission">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Submit Workflow to Marketplace</CardTitle>
          <p className="text-sm text-gray-600">
            Share your AgentFlowOS workflow with the community. Make it available for others to use and learn from.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Workflow Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter workflow name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description *
                </label>
                <TextArea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what this workflow does and how to use it"
                  rows={4}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Author *
                </label>
                <Input
                  type="text"
                  value={formData.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                  placeholder="Your name or organization"
                  className={errors.author ? 'border-red-500' : ''}
                />
                {errors.author && (
                  <p className="text-red-500 text-sm mt-1">{errors.author}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Version
                </label>
                <Input
                  type="text"
                  value={formData.version}
                  onChange={(e) => handleInputChange('version', e.target.value)}
                  placeholder="1.0.0"
                />
              </div>
            </div>

            {/* Categorization */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Categorization</h3>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Publishing Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Publishing Options</h3>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
                />
                <label htmlFor="isPublic" className="text-sm">
                  Make this workflow public in the marketplace
                </label>
              </div>

              {!formData.isPublic && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Price (USD)
                  </label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={errors.price ? 'border-red-500' : ''}
                  />
                  {errors.price && (
                    <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Set to 0 for free workflows
                  </p>
                </div>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Submitting...' : 'Submit to Marketplace'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default MarketplaceSubmission