import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class ExpressAdapter_Integrations implements INode {
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
        this.label = 'Express.js Adapter'
        this.name = 'expressAdapter'
        this.version = 1.0
        this.type = 'ExpressAdapter'
        this.category = 'Integrations'
        this.icon = 'express.svg'
        this.description = 'Create Express.js API endpoints that integrate with AgentFlowOS agents, assistants, and MCP tools'
        this.baseClasses = [this.type, 'Tool']
        this.inputs = [
            {
                label: 'Route Type',
                name: 'routeType',
                type: 'options',
                options: [
                    {
                        label: 'Agent Routes',
                        name: 'agents'
                    },
                    {
                        label: 'Assistant Routes',
                        name: 'assistants'
                    },
                    {
                        label: 'MCP Tool Routes',
                        name: 'mcp'
                    },
                    {
                        label: 'Admin Routes',
                        name: 'admin'
                    }
                ]
            },
            {
                label: 'Base Path',
                name: 'basePath',
                type: 'string',
                description: 'Base path for the API routes (e.g., /api/agentic-iq)',
                default: '/api/agentic-iq'
            },
            {
                label: 'Enable CORS',
                name: 'enableCors',
                type: 'boolean',
                description: 'Enable CORS headers for cross-origin requests',
                default: true
            },
            {
                label: 'Enable Authentication',
                name: 'enableAuth',
                type: 'boolean',
                description: 'Enable authentication validation for routes',
                default: false
            },
            {
                label: 'Allowed Methods',
                name: 'allowedMethods',
                type: 'multiOptions',
                options: [
                    { label: 'GET', name: 'GET' },
                    { label: 'POST', name: 'POST' },
                    { label: 'PUT', name: 'PUT' },
                    { label: 'DELETE', name: 'DELETE' },
                    { label: 'PATCH', name: 'PATCH' }
                ],
                default: ['GET', 'POST']
            },
            {
                label: 'Middleware',
                name: 'middleware',
                type: 'string',
                description: 'Custom middleware functions (JSON array)',
                optional: true
            },
            {
                label: 'Error Handler',
                name: 'errorHandler',
                type: 'string',
                description: 'Custom error handler function',
                optional: true
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const routeType = nodeData.inputs?.routeType as string
        const basePath = nodeData.inputs?.basePath as string
        const enableCors = nodeData.inputs?.enableCors as boolean
        const enableAuth = nodeData.inputs?.enableAuth as boolean
        const allowedMethods = nodeData.inputs?.allowedMethods as string[]
        const middleware = nodeData.inputs?.middleware as string
        const errorHandler = nodeData.inputs?.errorHandler as string

        return {
            routeType,
            basePath: basePath || '/api/agentic-iq',
            enableCors: enableCors !== false,
            enableAuth: enableAuth || false,
            allowedMethods: allowedMethods || ['GET', 'POST'],
            middleware,
            errorHandler
        }
    }

    async run(nodeData: INodeData): Promise<string | object> {
        const config = await this.init(nodeData)

        const tools = await this.createExpressTools(config)
        return tools
    }

    private async createExpressTools(config: any): Promise<any[]> {
        const tools = []

        // Create route configuration tool
        tools.push({
            name: 'express_adapter_config',
            description: 'Configure Express.js adapter for AgentFlowOS integration',
            schema: {
                type: 'object',
                properties: {
                    routeType: {
                        type: 'string',
                        enum: ['agents', 'assistants', 'mcp', 'admin'],
                        description: 'Type of routes to create'
                    },
                    basePath: {
                        type: 'string',
                        description: 'Base path for API routes'
                    },
                    enableCors: {
                        type: 'boolean',
                        description: 'Enable CORS headers'
                    },
                    enableAuth: {
                        type: 'boolean',
                        description: 'Enable authentication'
                    }
                },
                required: ['routeType']
            },
            func: async (params: any) => {
                return this.generateExpressRoutes(params, config)
            }
        })

        // Create middleware tool
        tools.push({
            name: 'express_middleware',
            description: 'Generate Express.js middleware for AgentFlowOS routes',
            schema: {
                type: 'object',
                properties: {
                    type: {
                        type: 'string',
                        enum: ['cors', 'auth', 'logging', 'custom'],
                        description: 'Type of middleware to generate'
                    },
                    config: {
                        type: 'object',
                        description: 'Middleware configuration'
                    }
                },
                required: ['type']
            },
            func: async (params: any) => {
                return this.generateMiddleware(params, config)
            }
        })

        // Create route handler tool
        tools.push({
            name: 'express_route_handler',
            description: 'Generate Express.js route handlers for AgentFlowOS endpoints',
            schema: {
                type: 'object',
                properties: {
                    endpoint: {
                        type: 'string',
                        description: 'API endpoint path'
                    },
                    method: {
                        type: 'string',
                        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                        description: 'HTTP method'
                    },
                    handlerType: {
                        type: 'string',
                        enum: ['agent_message', 'assistant_message', 'mcp_execute', 'admin_status'],
                        description: 'Type of handler to generate'
                    }
                },
                required: ['endpoint', 'method', 'handlerType']
            },
            func: async (params: any) => {
                return this.generateRouteHandler(params, config)
            }
        })

        return tools
    }

    private generateExpressRoutes(params: any, config: any): any {
        const { routeType, basePath, enableCors, enableAuth } = { ...config, ...params }

        const routes: any = {
            routeType,
            basePath,
            enableCors,
            enableAuth,
            routes: []
        }

        switch (routeType) {
            case 'agents':
                routes.routes = [
                    {
                        path: `${basePath}/agents`,
                        method: 'GET',
                        description: 'List all agents',
                        handler: 'listAgents'
                    },
                    {
                        path: `${basePath}/agents/:id`,
                        method: 'GET',
                        description: 'Get agent details',
                        handler: 'getAgent'
                    },
                    {
                        path: `${basePath}/agents/:id/message`,
                        method: 'POST',
                        description: 'Send message to agent',
                        handler: 'sendAgentMessage'
                    }
                ]
                break

            case 'assistants':
                routes.routes = [
                    {
                        path: `${basePath}/assistants`,
                        method: 'GET',
                        description: 'List all assistants',
                        handler: 'listAssistants'
                    },
                    {
                        path: `${basePath}/assistants/:id`,
                        method: 'GET',
                        description: 'Get assistant details',
                        handler: 'getAssistant'
                    },
                    {
                        path: `${basePath}/assistants/:id/message`,
                        method: 'POST',
                        description: 'Send message to assistant',
                        handler: 'sendAssistantMessage'
                    }
                ]
                break

            case 'mcp':
                routes.routes = [
                    {
                        path: `${basePath}/mcp/tools`,
                        method: 'GET',
                        description: 'List all MCP tools',
                        handler: 'listMCPTools'
                    },
                    {
                        path: `${basePath}/mcp/execute/:toolId`,
                        method: 'POST',
                        description: 'Execute MCP tool',
                        handler: 'executeMCPTool'
                    }
                ]
                break

            case 'admin':
                routes.routes = [
                    {
                        path: `${basePath}/admin/status`,
                        method: 'GET',
                        description: 'Get framework status',
                        handler: 'getStatus'
                    },
                    {
                        path: `${basePath}/admin/config`,
                        method: 'GET',
                        description: 'Get framework configuration',
                        handler: 'getConfig'
                    }
                ]
                break
        }

        return {
            success: true,
            data: routes,
            code: this.generateExpressCode(routes)
        }
    }

    private generateMiddleware(params: any, config: any): any {
        const { type, config: middlewareConfig } = params

        let middlewareCode = ''

        switch (type) {
            case 'cors':
                middlewareCode = `
app.use('${config.basePath}', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});`
                break

            case 'auth':
                middlewareCode = `
app.use('${config.basePath}', (req, res, next) => {
  // Authentication middleware
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Validate token here
  next();
});`
                break

            case 'logging':
                middlewareCode = `
app.use('${config.basePath}', (req, res, next) => {
  console.log(\`\${req.method} \${req.path} - \${new Date().toISOString()}\`);
  next();
});`
                break

            case 'custom':
                middlewareCode = `
// Custom middleware
${middlewareConfig?.code || '// Add your custom middleware logic here'}`
                break
        }

        return {
            success: true,
            type,
            code: middlewareCode.trim()
        }
    }

    private generateRouteHandler(params: any, config: any): any {
        const { endpoint, method, handlerType } = params

        let handlerCode = ''

        switch (handlerType) {
            case 'agent_message':
                handlerCode = `
app.${method.toLowerCase()}('${endpoint}', async (req, res) => {
  try {
    const agentId = req.params.id || req.body.agentId;
    const message = req.body.message;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Send message to agent
    const response = await agentFramework.queryAgent(agentId, {
      prompt: message,
      contextData: req.body.context
    });

    res.json({
      success: true,
      data: {
        agentId,
        message,
        response: response.response,
        task: response.task
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});`
                break

            case 'assistant_message':
                handlerCode = `
app.${method.toLowerCase()}('${endpoint}', async (req, res) => {
  try {
    const assistantId = req.params.id || req.body.assistantId;
    const message = req.body.message;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Send message to assistant
    const response = await assistantFramework.processMessage(assistantId, message);

    res.json({
      success: true,
      data: {
        assistantId,
        message,
        response: response.message,
        metadata: response.metadata
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});`
                break

            case 'mcp_execute':
                handlerCode = `
app.${method.toLowerCase()}('${endpoint}', async (req, res) => {
  try {
    const toolId = req.params.toolId;
    const params = req.body.params || {};

    // Execute MCP tool
    const result = await mcpRegistry.executeTool(toolId, params);

    res.json({
      success: true,
      data: {
        toolId,
        result,
        params
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});`
                break

            case 'admin_status':
                handlerCode = `
app.${method.toLowerCase()}('${endpoint}', async (req, res) => {
  try {
    const status = await framework.getStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});`
                break
        }

        return {
            success: true,
            endpoint,
            method,
            handlerType,
            code: handlerCode.trim()
        }
    }

    private generateExpressCode(routes: any): string {
        const imports = `const express = require('express');
const { agentFramework } = require('./path/to/agentFramework');
const { mcpRegistry } = require('./path/to/mcpRegistry');
// Add other imports as needed`

        const middleware = routes.enableCors ? `
app.use('${routes.basePath}', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});` : ''

        const routeHandlers = routes.routes.map((route: any) => {
            return `
// ${route.description}
app.${route.method.toLowerCase()}('${route.path}', async (req, res) => {
  try {
    // ${route.handler} implementation
    res.json({ success: true, message: '${route.description}' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});`
        }).join('\n')

        return `${imports}

const app = express();
app.use(express.json());${middleware}

${routeHandlers}

module.exports = app;`
    }
}

module.exports = { nodeClass: ExpressAdapter_Integrations }