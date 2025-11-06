import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class NextjsAdapter_Integrations implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    baseClasses: string[]
    inputs: INodeParams[]

    constructor() {
        this.label = 'Next.js Adapter'
        this.name = 'nextjsAdapter'
        this.version = 1.0
        this.type = 'NextjsAdapter'
        this.category = 'Integrations'
        this.icon = 'nextjs.svg'
        this.description = 'Create Next.js API routes and pages that integrate with AgentFlowOS agents, assistants, and MCP tools'
        this.baseClasses = [this.type, 'Tool']
        this.inputs = [
            {
                label: 'Route Type',
                name: 'routeType',
                type: 'options',
                options: [
                    {
                        label: 'API Routes',
                        name: 'api'
                    },
                    {
                        label: 'Pages',
                        name: 'pages'
                    },
                    {
                        label: 'App Router',
                        name: 'app'
                    },
                    {
                        label: 'Middleware',
                        name: 'middleware'
                    }
                ]
            },
            {
                label: 'Base Path',
                name: 'basePath',
                type: 'string',
                description: 'Base path for the routes (e.g., /api/agentic-iq)',
                default: '/api/agentic-iq'
            },
            {
                label: 'Enable Authentication',
                name: 'enableAuth',
                type: 'boolean',
                description: 'Enable authentication validation for routes',
                default: false
            },
            {
                label: 'Enable CORS',
                name: 'enableCors',
                type: 'boolean',
                description: 'Enable CORS headers for cross-origin requests',
                default: true
            },
            {
                label: 'Framework Integration',
                name: 'frameworkIntegration',
                type: 'options',
                options: [
                    {
                        label: 'AgentFlowOS Agents',
                        name: 'agents'
                    },
                    {
                        label: 'AgentFlowOS Assistants',
                        name: 'assistants'
                    },
                    {
                        label: 'MCP Tools',
                        name: 'mcp'
                    },
                    {
                        label: 'Admin Panel',
                        name: 'admin'
                    }
                ]
            },
            {
                label: 'SSR/SSG Support',
                name: 'ssrSupport',
                type: 'boolean',
                description: 'Enable server-side rendering support for agent data',
                default: false
            },
            {
                label: 'Custom Middleware',
                name: 'customMiddleware',
                type: 'string',
                description: 'Custom middleware functions (JSON array)',
                optional: true
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const routeType = nodeData.inputs?.routeType as string
        const basePath = nodeData.inputs?.basePath as string
        const enableAuth = nodeData.inputs?.enableAuth as boolean
        const enableCors = nodeData.inputs?.enableCors as boolean
        const frameworkIntegration = nodeData.inputs?.frameworkIntegration as string
        const ssrSupport = nodeData.inputs?.ssrSupport as boolean
        const customMiddleware = nodeData.inputs?.customMiddleware as string

        return {
            routeType,
            basePath: basePath || '/api/agentic-iq',
            enableAuth: enableAuth || false,
            enableCors: enableCors !== false,
            frameworkIntegration,
            ssrSupport: ssrSupport || false,
            customMiddleware
        }
    }

    async run(nodeData: INodeData): Promise<string | object> {
        const config = await this.init(nodeData)

        const tools = await this.createNextjsTools(config)
        return tools
    }

    private async createNextjsTools(config: any): Promise<any[]> {
        const tools = []

        // Create API route generator tool
        tools.push({
            name: 'nextjs_api_route',
            description: 'Generate Next.js API routes for AgentFlowOS integration',
            schema: {
                type: 'object',
                properties: {
                    endpoint: {
                        type: 'string',
                        description: 'API endpoint path (e.g., /agents/[id]/message)'
                    },
                    method: {
                        type: 'string',
                        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                        description: 'HTTP method'
                    },
                    integrationType: {
                        type: 'string',
                        enum: ['agents', 'assistants', 'mcp', 'admin'],
                        description: 'Type of AgentFlowOS integration'
                    },
                    dynamicRoute: {
                        type: 'boolean',
                        description: 'Whether this is a dynamic route with parameters'
                    }
                },
                required: ['endpoint', 'method', 'integrationType']
            },
            func: async (params: any) => {
                return this.generateAPIRoute(params, config)
            }
        })

        // Create page generator tool
        tools.push({
            name: 'nextjs_page',
            description: 'Generate Next.js pages with AgentFlowOS integration',
            schema: {
                type: 'object',
                properties: {
                    pagePath: {
                        type: 'string',
                        description: 'Page path (e.g., /agents/[id])'
                    },
                    pageType: {
                        type: 'string',
                        enum: ['static', 'dynamic', 'ssr', 'ssg'],
                        description: 'Type of Next.js page rendering'
                    },
                    integrationType: {
                        type: 'string',
                        enum: ['agents', 'assistants', 'mcp', 'admin'],
                        description: 'Type of AgentFlowOS integration'
                    },
                    withAuth: {
                        type: 'boolean',
                        description: 'Include authentication checks'
                    }
                },
                required: ['pagePath', 'pageType', 'integrationType']
            },
            func: async (params: any) => {
                return this.generatePage(params, config)
            }
        })

        // Create middleware generator tool
        tools.push({
            name: 'nextjs_middleware',
            description: 'Generate Next.js middleware for AgentFlowOS integration',
            schema: {
                type: 'object',
                properties: {
                    middlewareType: {
                        type: 'string',
                        enum: ['auth', 'cors', 'logging', 'agent-context', 'custom'],
                        description: 'Type of middleware to generate'
                    },
                    config: {
                        type: 'object',
                        description: 'Middleware configuration'
                    }
                },
                required: ['middlewareType']
            },
            func: async (params: any) => {
                return this.generateMiddleware(params, config)
            }
        })

        // Create app router generator tool
        tools.push({
            name: 'nextjs_app_router',
            description: 'Generate Next.js App Router routes for AgentFlowOS integration',
            schema: {
                type: 'object',
                properties: {
                    routePath: {
                        type: 'string',
                        description: 'App router path (e.g., /dashboard/agents/[id])'
                    },
                    routeType: {
                        type: 'string',
                        enum: ['page', 'layout', 'loading', 'error', 'not-found'],
                        description: 'Type of app router file'
                    },
                    integrationType: {
                        type: 'string',
                        enum: ['agents', 'assistants', 'mcp', 'admin'],
                        description: 'Type of AgentFlowOS integration'
                    }
                },
                required: ['routePath', 'routeType', 'integrationType']
            },
            func: async (params: any) => {
                return this.generateAppRouter(params, config)
            }
        })

        return tools
    }

    private generateAPIRoute(params: any, config: any): any {
        const { endpoint, method, integrationType, dynamicRoute } = params

        let routeCode = ''

        switch (integrationType) {
            case 'agents':
                if (endpoint.includes('[id]') || dynamicRoute) {
                    routeCode = `import { NextApiRequest, NextApiResponse } from 'next'
import { agentFramework } from '../../../lib/agentFramework'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== '${method}') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query

    if (req.method === 'GET') {
      // Get agent details
      const agent = await agentFramework.getAgent(id as string)
      return res.status(200).json({ success: true, data: agent })
    }

    if (req.method === 'POST' && req.url?.includes('/message')) {
      // Send message to agent
      const { message, context } = req.body

      if (!message) {
        return res.status(400).json({ error: 'Message is required' })
      }

      const response = await agentFramework.queryAgent(id as string, {
        prompt: message,
        contextData: context
      })

      return res.status(200).json({
        success: true,
        data: {
          agentId: id,
          message,
          response: response.response,
          task: response.task
        }
      })
    }

    return res.status(400).json({ error: 'Invalid request' })
  } catch (error) {
    console.error('Agent API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}`
                } else {
                    routeCode = `import { NextApiRequest, NextApiResponse } from 'next'
import { agentFramework } from '../../../lib/agentFramework'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== '${method}') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (req.method === 'GET') {
      // List all agents
      const agents = await agentFramework.listAgents()
      return res.status(200).json({ success: true, data: agents })
    }

    return res.status(400).json({ error: 'Invalid request' })
  } catch (error) {
    console.error('Agents API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}`
                }
                break

            case 'assistants':
                routeCode = `import { NextApiRequest, NextApiResponse } from 'next'
import { assistantFramework } from '../../../lib/assistantFramework'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== '${method}') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query

    if (req.method === 'GET') {
      if (id) {
        // Get assistant details
        const assistant = await assistantFramework.getAssistant(id as string)
        return res.status(200).json({ success: true, data: assistant })
      } else {
        // List all assistants
        const assistants = await assistantFramework.listAssistants()
        return res.status(200).json({ success: true, data: assistants })
      }
    }

    if (req.method === 'POST' && req.url?.includes('/message')) {
      // Send message to assistant
      const { message } = req.body

      if (!message) {
        return res.status(400).json({ error: 'Message is required' })
      }

      const response = await assistantFramework.processMessage(id as string, message)

      return res.status(200).json({
        success: true,
        data: {
          assistantId: id,
          message,
          response: response.message,
          metadata: response.metadata
        }
      })
    }

    return res.status(400).json({ error: 'Invalid request' })
  } catch (error) {
    console.error('Assistant API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}`
                break

            case 'mcp':
                routeCode = `import { NextApiRequest, NextApiResponse } from 'next'
import { mcpRegistry } from '../../../lib/mcpRegistry'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== '${method}') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (req.method === 'GET') {
      // List all MCP tools
      const tools = await mcpRegistry.listTools()
      return res.status(200).json({ success: true, data: tools })
    }

    if (req.method === 'POST') {
      // Execute MCP tool
      const { toolId } = req.query
      const params = req.body.params || {}

      const result = await mcpRegistry.executeTool(toolId as string, params)

      return res.status(200).json({
        success: true,
        data: {
          toolId,
          result,
          params
        }
      })
    }

    return res.status(400).json({ error: 'Invalid request' })
  } catch (error) {
    console.error('MCP API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}`
                break

            case 'admin':
                routeCode = `import { NextApiRequest, NextApiResponse } from 'next'
import { framework } from '../../../lib/framework'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== '${method}') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (req.method === 'GET') {
      if (req.url?.includes('/status')) {
        // Get framework status
        const status = await framework.getStatus()
        return res.status(200).json({ success: true, data: status })
      }

      if (req.url?.includes('/config')) {
        // Get framework configuration
        const config = await framework.getConfig()
        return res.status(200).json({ success: true, data: config })
      }
    }

    return res.status(400).json({ error: 'Invalid request' })
  } catch (error) {
    console.error('Admin API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}`
                break
        }

        return {
            success: true,
            endpoint,
            method,
            integrationType,
            code: routeCode.trim(),
            filePath: `pages${endpoint}.ts`
        }
    }

    private generatePage(params: any, config: any): any {
        const { pagePath, pageType, integrationType, withAuth } = params

        let pageCode = ''

        const authCheck = withAuth ? `
  // Authentication check
  const { data: session } = useSession()
  if (!session) {
    return <div>Please sign in to access this page.</div>
  }
` : ''

        switch (integrationType) {
            case 'agents':
                if (pageType === 'dynamic') {
                    pageCode = `import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface Agent {
  id: string
  name: string
  description: string
  status: string
}

export default function AgentPage() {
  const router = useRouter()
  const { id } = router.query
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')

  ${authCheck}

  useEffect(() => {
    if (id) {
      fetchAgent()
    }
  }, [id])

  const fetchAgent = async () => {
    try {
      const res = await fetch(\`/api/agents/\${id}\`)
      const data = await res.json()
      if (data.success) {
        setAgent(data.data)
      }
    } catch (error) {
      console.error('Error fetching agent:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!message.trim()) return

    try {
      const res = await fetch(\`/api/agents/\${id}/message\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })
      const data = await res.json()
      if (data.success) {
        setResponse(data.data.response)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!agent) return <div>Agent not found</div>

  return (
    <div>
      <h1>{agent.name}</h1>
      <p>{agent.description}</p>
      <div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
      {response && (
        <div>
          <h3>Response:</h3>
          <p>{response}</p>
        </div>
      )}
    </div>
  )
}`
                } else {
                    pageCode = `import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface Agent {
  id: string
  name: string
  description: string
  status: string
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  ${authCheck}

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents')
      const data = await res.json()
      if (data.success) {
        setAgents(data.data)
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>AgentFlowOS Agents</h1>
      <div>
        {agents.map(agent => (
          <div key={agent.id}>
            <h3>{agent.name}</h3>
            <p>{agent.description}</p>
            <p>Status: {agent.status}</p>
          </div>
        ))}
      </div>
    </div>
  )
}`
                }
                break

            case 'assistants':
                pageCode = `import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface Assistant {
  id: string
  name: string
  description: string
  capabilities: string[]
}

export default function AssistantsPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [loading, setLoading] = useState(true)

  ${authCheck}

  useEffect(() => {
    fetchAssistants()
  }, [])

  const fetchAssistants = async () => {
    try {
      const res = await fetch('/api/assistants')
      const data = await res.json()
      if (data.success) {
        setAssistants(data.data)
      }
    } catch (error) {
      console.error('Error fetching assistants:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>AgentFlowOS Assistants</h1>
      <div>
        {assistants.map(assistant => (
          <div key={assistant.id}>
            <h3>{assistant.name}</h3>
            <p>{assistant.description}</p>
            <div>
              <strong>Capabilities:</strong>
              <ul>
                {assistant.capabilities.map(cap => (
                  <li key={cap}>{cap}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}`
                break

            case 'mcp':
                pageCode = `import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface MCPTool {
  id: string
  name: string
  description: string
  parameters: any[]
}

export default function MCPToolsPage() {
  const [tools, setTools] = useState<MCPTool[]>([])
  const [loading, setLoading] = useState(true)

  ${authCheck}

  useEffect(() => {
    fetchTools()
  }, [])

  const fetchTools = async () => {
    try {
      const res = await fetch('/api/mcp/tools')
      const data = await res.json()
      if (data.success) {
        setTools(data.data)
      }
    } catch (error) {
      console.error('Error fetching MCP tools:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>MCP Tools</h1>
      <div>
        {tools.map(tool => (
          <div key={tool.id}>
            <h3>{tool.name}</h3>
            <p>{tool.description}</p>
            <div>
              <strong>Parameters:</strong>
              <pre>{JSON.stringify(tool.parameters, null, 2)}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}`
                break

            case 'admin':
                pageCode = `import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface FrameworkStatus {
  version: string
  uptime: number
  agents: number
  assistants: number
  mcpTools: number
}

export default function AdminPage() {
  const [status, setStatus] = useState<FrameworkStatus | null>(null)
  const [loading, setLoading] = useState(true)

  ${authCheck}

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/status')
      const data = await res.json()
      if (data.success) {
        setStatus(data.data)
      }
    } catch (error) {
      console.error('Error fetching status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!status) return <div>Unable to load status</div>

  return (
    <div>
      <h1>AgentFlowOS Admin Panel</h1>
      <div>
        <p><strong>Version:</strong> {status.version}</p>
        <p><strong>Uptime:</strong> {Math.floor(status.uptime / 1000 / 60)} minutes</p>
        <p><strong>Active Agents:</strong> {status.agents}</p>
        <p><strong>Active Assistants:</strong> {status.assistants}</p>
        <p><strong>MCP Tools:</strong> {status.mcpTools}</p>
      </div>
    </div>
  )
}`
                break
        }

        return {
            success: true,
            pagePath,
            pageType,
            integrationType,
            code: pageCode.trim(),
            filePath: `pages${pagePath}.tsx`
        }
    }

    private generateMiddleware(params: any, config: any): any {
        const { middlewareType, config: middlewareConfig } = params

        let middlewareCode = ''

        switch (middlewareType) {
            case 'auth':
                middlewareCode = `import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Add custom auth logic here
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: ['/api/agentic-iq/:path*', '/dashboard/:path*']
}`
                break

            case 'cors':
                middlewareCode = `import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200 })
  }

  return response
}

export const config = {
  matcher: '/api/:path*'
}`
                break

            case 'logging':
                middlewareCode = `import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const start = Date.now()

  console.log(\`[\${new Date().toISOString()}] \${request.method} \${request.url}\`)

  const response = NextResponse.next()

  const end = Date.now()
  console.log(\`[\${new Date().toISOString()}] Completed in \${end - start}ms\`)

  return response
}

export const config = {
  matcher: '/api/:path*'
}`
                break

            case 'agent-context':
                middlewareCode = `import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add agent context headers
  const agentId = request.cookies.get('agentflowos-agent-id')?.value
  if (agentId) {
    response.headers.set('X-AgentFlowOS-Agent-ID', agentId)
  }

  // Add session context
  const sessionId = request.cookies.get('agentflowos-session-id')?.value
  if (sessionId) {
    response.headers.set('X-AgentFlowOS-Session-ID', sessionId)
  }

  return response
}

export const config = {
  matcher: '/api/agentic-iq/:path*'
}`
                break

            case 'custom':
                middlewareCode = `import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Custom middleware logic
  ${middlewareConfig?.code || '// Add your custom middleware logic here'}

  return NextResponse.next()
}

export const config = {
  matcher: ${JSON.stringify(middlewareConfig?.matcher || '/api/:path*')}
}`
                break
        }

        return {
            success: true,
            middlewareType,
            code: middlewareCode.trim(),
            filePath: 'middleware.ts'
        }
    }

    private generateAppRouter(params: any, config: any): any {
        const { routePath, routeType, integrationType } = params

        let routerCode = ''

        switch (routeType) {
            case 'page':
                routerCode = `import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AgentFlowOS ${integrationType.charAt(0).toUpperCase() + integrationType.slice(1)}',
  description: 'AgentFlowOS ${integrationType} management interface'
}

export default function Page() {
  return (
    <div>
      <h1>AgentFlowOS ${integrationType.charAt(0).toUpperCase() + integrationType.slice(1)}</h1>
      {/* Add your ${integrationType} interface here */}
    </div>
  )
}`
                break

            case 'layout':
                routerCode = `export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="agentflowos-layout">
      <header>
        <nav>
          <h1>AgentFlowOS Studio</h1>
          {/* Navigation for ${integrationType} */}
        </nav>
      </header>
      <main>{children}</main>
      <footer>
        <p>Powered by AgentFlowOS</p>
      </footer>
    </div>
  )
}`
                break

            case 'loading':
                routerCode = `export default function Loading() {
  return (
    <div className="loading">
      <div className="spinner"></div>
      <p>Loading AgentFlowOS ${integrationType}...</p>
    </div>
  )
}`
                break

            case 'error':
                routerCode = `'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="error">
      <h2>Something went wrong with AgentFlowOS ${integrationType}</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}`
                break

            case 'not-found':
                routerCode = `export default function NotFound() {
  return (
    <div className="not-found">
      <h2>AgentFlowOS ${integrationType} Not Found</h2>
      <p>The requested ${integrationType} could not be found.</p>
    </div>
  )
}`
                break
        }

        return {
            success: true,
            routePath,
            routeType,
            integrationType,
            code: routerCode.trim(),
            filePath: `app${routePath}/${routeType}.tsx`
        }
    }
}

module.exports = { nodeClass: NextjsAdapter_Integrations }