import { Tool } from '@langchain/core/tools'
import { getBaseClasses } from '../../../src/utils'
import { INode, INodeData, INodeParams } from '../../../src/Interface'

class MCPTool_Tools implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]

    constructor() {
        this.label = 'MCP Tool'
        this.name = 'mcpTool'
        this.version = 1.0
        this.type = 'Tool'
        this.category = 'Tools'
        this.icon = 'tool.svg'
        this.description = 'Tool for calling MCP (Model Context Protocol) tools from external platforms'
        this.baseClasses = [this.type, ...getBaseClasses(Tool)]
        this.inputs = [
            {
                label: 'Platform Name',
                name: 'platform',
                type: 'string',
                description: 'Name of the MCP platform'
            },
            {
                label: 'Tool Name',
                name: 'toolName',
                type: 'string',
                description: 'Name of the tool to call'
            },
            {
                label: 'Tool Description',
                name: 'description',
                type: 'string',
                description: 'Description of what the tool does',
                rows: 3
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const platform = nodeData.inputs?.platform as string
        const toolName = nodeData.inputs?.toolName as string
        const description = nodeData.inputs?.description as string

        if (!platform || !toolName) {
            throw new Error('Platform and Tool Name are required')
        }

        const tool = new MCPToolWrapper(platform, toolName, description || `MCP tool ${toolName} from ${platform}`)
        return tool
    }

    async run(nodeData: INodeData): Promise<string | object> {
        return await this.init(nodeData)
    }
}

class MCPToolWrapper extends Tool {
    name: string
    description: string
    platform: string
    toolName: string

    constructor(platform: string, toolName: string, description: string) {
        super()
        this.name = `${platform}_${toolName}`
        this.description = description
        this.platform = platform
        this.toolName = toolName
    }

    async _call(input: string): Promise<string> {
        try {
            // Import MCP registry dynamically
            const { mcpRegistry } = await import('../../../../server/src/mcp/registry')

            // Call the platform tool
            const response = await mcpRegistry.callPlatformTool(this.platform, this.toolName, { input })

            if (response.status.code === 200) {
                return typeof response.result === 'string' ? response.result : JSON.stringify(response.result)
            } else {
                throw new Error(response.error?.message || 'MCP tool call failed')
            }
        } catch (error) {
            throw new Error(`Failed to call MCP tool: ${error instanceof Error ? error.message : String(error)}`)
        }
    }
}

module.exports = { nodeClass: MCPTool_Tools }