import React, { useState, useEffect, useRef } from 'react'
import { Button, Input, Card, CardContent, ScrollArea } from '../../../src/ui-component'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  workflowNode?: string
  metadata?: any
}

interface WorkflowChatInterfaceProps {
  workflowId: string
  onExecuteWorkflow: (message: string, context?: any) => Promise<any>
  onWorkflowUpdate?: (updates: any) => void
  initialMessages?: Message[]
  className?: string
}

const WorkflowChatInterface: React.FC<WorkflowChatInterfaceProps> = ({
  workflowId,
  onExecuteWorkflow,
  onWorkflowUpdate,
  initialMessages = [],
  className = ''
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isWorkflowMode, setIsWorkflowMode] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Execute workflow with the message
      const result = await onExecuteWorkflow(inputMessage, {
        chatHistory: messages,
        workflowMode: isWorkflowMode
      })

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response || result.message || 'Workflow executed successfully',
        timestamp: new Date(),
        workflowNode: result.executedNode,
        metadata: result.metadata
      }

      setMessages(prev => [...prev, assistantMessage])

      // If workflow was modified, notify parent
      if (result.workflowUpdates && onWorkflowUpdate) {
        onWorkflowUpdate(result.workflowUpdates)
      }

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'system',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const exportChat = () => {
    const chatData = {
      workflowId,
      messages,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workflow-chat-${workflowId}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className={`workflow-chat-interface ${className}`}>
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">Workflow Chat</h3>
          <span className="text-sm text-gray-500">({messages.length} messages)</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={isWorkflowMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsWorkflowMode(!isWorkflowMode)}
          >
            {isWorkflowMode ? 'Workflow Mode' : 'Chat Mode'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportChat}>
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={clearChat}>
            Clear
          </Button>
        </div>
      </div>

      <CardContent className="p-0">
        <ScrollArea className="h-96 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p>Start a conversation with your workflow!</p>
                <p className="text-sm mt-2">
                  {isWorkflowMode
                    ? 'Workflow mode: Commands will modify and execute the visual workflow'
                    : 'Chat mode: Natural conversation with AI agents'
                  }
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.role === 'assistant'
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  {message.workflowNode && (
                    <p className="text-xs mt-1 opacity-75">
                      Executed: {message.workflowNode}
                    </p>
                  )}
                  <p className="text-xs mt-1 opacity-50">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    <span className="text-sm">Processing...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder={
                isWorkflowMode
                  ? "Describe workflow changes or ask questions..."
                  : "Type your message..."
              }
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            {isWorkflowMode ? (
              <p>
                💡 <strong>Workflow Mode:</strong> Try commands like:
                "Add a new customer support agent", "Connect these nodes", "Run the workflow"
              </p>
            ) : (
              <p>
                💬 <strong>Chat Mode:</strong> Have a natural conversation with AI agents
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default WorkflowChatInterface