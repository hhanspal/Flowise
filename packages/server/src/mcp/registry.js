/**
 * MCP Registry
 *
 * This module provides a registry for MCP tools, allowing tools to be registered,
 * discovered, and used by agents and other components.
 */
import { v4 as uuidv4 } from 'uuid';
import { MCPStatusCode, MCPErrorCode } from './types';
import logger from '../../utils/logger';
/**
 * MCP Registry Implementation - Enhanced for Multi-Platform Support
 */
export class MCPRegistry {
    constructor() {
        this.toolDefinitions = new Map();
        this.toolHandlers = new Map();
        // Multi-platform support
        this.platformConnections = new Map();
        this.platformConfigs = new Map();
    }
    /**
     * Get the singleton instance
     */
    static getInstance() {
        if (!MCPRegistry.instance) {
            MCPRegistry.instance = new MCPRegistry();
        }
        return MCPRegistry.instance;
    }
    /**
     * Register a tool with the registry
     */
    registerTool(definition, handler) {
        try {
            // Validate the tool definition
            if (!definition.id || !definition.name || !definition.description) {
                throw new Error('Tool definition missing required fields (id, name, description)');
            }
            // Check if the tool is already registered
            if (this.toolDefinitions.has(definition.id)) {
                console.warn(`Tool with ID ${definition.id} is already registered. Overwriting.`);
            }
            // Register the tool
            this.toolDefinitions.set(definition.id, definition);
            this.toolHandlers.set(definition.id, handler);
            console.log(`Tool registered: ${definition.name} (${definition.id})`);
        }
        catch (error) {
            console.error(`Failed to register tool ${definition.id}:`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
    /**
     * Unregister a tool from the registry
     */
    unregisterTool(toolId) {
        const definitionRemoved = this.toolDefinitions.delete(toolId);
        const handlerRemoved = this.toolHandlers.delete(toolId);
        if (definitionRemoved && handlerRemoved) {
            console.log(`Tool unregistered: ${toolId}`);
            return true;
        }
        return false;
    }
    /**
     * Get a tool definition by ID
     */
    getToolDefinition(toolId) {
        return this.toolDefinitions.get(toolId);
    }
    /**
     * Get a tool handler by ID
     */
    getToolHandler(toolId) {
        return this.toolHandlers.get(toolId);
    }
    /**
     * Get all tool definitions
     */
    getAllToolDefinitions() {
        return Array.from(this.toolDefinitions.values());
    }
    /**
     * Get all tools (definitions and handlers)
     */
    getAllTools() {
        return this.getAllToolDefinitions().map(definition => ({
            definition,
            handler: this.toolHandlers.get(definition.id)
        }));
    }
    /**
     * Get tools by capability
     */
    getToolsByCapability(capability) {
        return this.getAllToolDefinitions().filter(definition => definition.capabilities.includes(capability));
    }
    /**
     * Get tools by tag
     */
    getToolsByTag(tag) {
        return this.getAllToolDefinitions().filter(definition => definition.tags.includes(tag));
    }
    /**
     * Call a tool with the given parameters
     */
    async callTool(toolId, parameters, context) {
        try {
            // Get the tool definition and handler
            const definition = this.getToolDefinition(toolId);
            const handler = this.getToolHandler(toolId);
            if (!definition || !handler) {
                return {
                    requestId: uuidv4(),
                    status: {
                        code: MCPStatusCode.NOT_FOUND,
                        message: 'Tool Not Found'
                    },
                    error: {
                        code: MCPErrorCode.RESOURCE_NOT_FOUND,
                        message: `Tool with ID ${toolId} not found`
                    }
                };
            }
            // Create the MCP request
            const request = {
                requestId: uuidv4(),
                tool: {
                    id: definition.id,
                    name: definition.name,
                    version: definition.version
                },
                parameters,
                context: context ? { metadata: context } : undefined
            };
            // Call the handler
            const response = await handler(request);
            return response;
        }
        catch (error) {
            // If anything goes wrong, return an error response
            return {
                requestId: uuidv4(),
                status: {
                    code: MCPStatusCode.INTERNAL_SERVER_ERROR,
                    message: 'Error'
                },
                error: {
                    code: MCPErrorCode.EXECUTION_ERROR,
                    message: error instanceof Error ? error.message : String(error)
                }
            };
        }
    }
    // ================================
    // Multi-Platform Methods
    // ================================
    /**
     * Register a platform for MCP communication
     */
    async registerPlatform(config) {
        try {
            console.log(`Registering platform: ${config.name}`);
            // Store the configuration
            this.platformConfigs.set(config.name, config);
            // Create connection object
            const connection = {
                id: uuidv4(),
                platform: config.name,
                status: 'connecting',
                capabilities: {
                    tools: false,
                    resources: false,
                    prompts: false
                },
                tools: []
            };
            this.platformConnections.set(config.name, connection);
            // Attempt to connect and discover capabilities
            try {
                const capabilities = await this.discoverPlatformCapabilities(config.name);
                // Update connection with discovered capabilities
                connection.status = 'connected';
                connection.capabilities = {
                    tools: capabilities.tools.length > 0,
                    resources: capabilities.resources.length > 0,
                    prompts: capabilities.prompts.length > 0
                };
                connection.tools = capabilities.tools;
                connection.lastConnected = new Date();
                // Register discovered tools with platform prefix
                capabilities.tools.forEach(tool => {
                    const platformTool = {
                        ...tool,
                        id: `${config.name}:${tool.id}`,
                        platform: config.name
                    };
                    // Create a handler that routes to the platform
                    const platformHandler = async (request) => {
                        return await this.callPlatformTool(config.name, tool.id, request.parameters || {});
                    };
                    this.registerTool(platformTool, platformHandler);
                });
                console.log(`Platform ${config.name} connected successfully with ${capabilities.tools.length} tools`);
            }
            catch (error) {
                connection.status = 'error';
                connection.error = error instanceof Error ? error.message : String(error);
                console.error(`Failed to connect to platform ${config.name}:`, error);
            }
        }
        catch (error) {
            console.error(`Failed to register platform ${config.name}:`, error);
            throw error;
        }
    }
    /**
     * Unregister a platform
     */
    async unregisterPlatform(platformName) {
        try {
            // Remove platform-specific tools
            const platformTools = this.getToolsByPlatform(platformName);
            platformTools.forEach(tool => {
                this.unregisterTool(tool.id);
            });
            // Remove platform connections and configs
            this.platformConnections.delete(platformName);
            this.platformConfigs.delete(platformName);
            console.log(`Platform ${platformName} unregistered successfully`);
        }
        catch (error) {
            console.error(`Failed to unregister platform ${platformName}:`, error);
            throw error;
        }
    }
    /**
     * Get platform connection info
     */
    getPlatformConnection(platformName) {
        return this.platformConnections.get(platformName);
    }
    /**
     * Get all platform connections
     */
    getAllPlatforms() {
        return Array.from(this.platformConnections.values());
    }
    /**
     * Discover capabilities of a platform
     */
    async discoverPlatformCapabilities(platformName) {
        const config = this.platformConfigs.get(platformName);
        if (!config) {
            throw new Error(`Platform ${platformName} not found`);
        }
        // Use Universal MCP Client to discover actual platform capabilities
        try {
            const { universalMCPClient } = await import('../../services/universal-mcp-client');
            const capabilities = await universalMCPClient.discoverPlatformCapabilities(platformName);
            return capabilities;
        }
        catch (error) {
            logger.warn(`Failed to discover capabilities for ${platformName}, returning empty capabilities`, {
                metadata: { error: error instanceof Error ? error.message : String(error) }
            });
            // Return empty capabilities if discovery fails
            const emptyCapabilities = {
                platform: platformName,
                tools: [],
                resources: [],
                prompts: [],
                agents: []
            };
            return emptyCapabilities;
        }
    }
    /**
     * Get tools for a specific platform
     */
    getToolsByPlatform(platformName) {
        return this.getAllToolDefinitions().filter(tool => tool.platform === platformName);
    }
    /**
     * Call a tool on a specific platform
     */
    async callPlatformTool(platformName, toolName, parameters) {
        const connection = this.platformConnections.get(platformName);
        if (!connection) {
            return {
                requestId: uuidv4(),
                status: {
                    code: MCPStatusCode.NOT_FOUND,
                    message: 'Platform Not Found'
                },
                error: {
                    code: MCPErrorCode.RESOURCE_NOT_FOUND,
                    message: `Platform ${platformName} not found`
                }
            };
        }
        if (connection.status !== 'connected') {
            return {
                requestId: uuidv4(),
                status: {
                    code: MCPStatusCode.SERVICE_UNAVAILABLE,
                    message: 'Platform Not Available'
                },
                error: {
                    code: MCPErrorCode.SERVICE_ERROR,
                    message: `Platform ${platformName} is not connected (status: ${connection.status})`
                }
            };
        }
        // Use Universal MCP Client to call tool on external platform
        try {
            const { universalMCPClient } = await import('../../services/universal-mcp-client');
            const response = await universalMCPClient.callTool(platformName, toolName, parameters);
            return response;
        }
        catch (error) {
            logger.error(`Failed to call tool ${toolName} on platform ${platformName}:`, error instanceof Error ? error : new Error(String(error)));
            return {
                requestId: uuidv4(),
                status: {
                    code: MCPStatusCode.INTERNAL_SERVER_ERROR,
                    message: 'Tool execution failed'
                },
                error: {
                    code: MCPErrorCode.EXECUTION_ERROR,
                    message: error instanceof Error ? error.message : String(error)
                }
            };
        }
    }
    /**
     * Discover agents across platforms
     */
    async discoverAgents(platformName) {
        const agents = [];
        if (platformName) {
            // Discover agents for specific platform
            const platformAgents = await this.getAgentsByPlatform(platformName);
            agents.push(...platformAgents);
        }
        else {
            // Discover agents across all platforms
            const platforms = Array.from(this.platformConnections.keys());
            for (const platform of platforms) {
                try {
                    const platformAgents = await this.getAgentsByPlatform(platform);
                    agents.push(...platformAgents);
                }
                catch (error) {
                    console.warn(`Failed to discover agents for platform ${platform}:`, error);
                }
            }
        }
        return agents;
    }
    /**
     * Get agents for a specific platform
     */
    async getAgentsByPlatform(platformName) {
        const connection = this.platformConnections.get(platformName);
        if (!connection || connection.status !== 'connected') {
            return [];
        }
        // Use Agent Discovery Service to get agents for platform
        try {
            const { agentDiscoveryService } = await import('../../services/agent-discovery');
            const agents = agentDiscoveryService.getPlatformAgents(platformName);
            return agents.map((agent) => ({
                agentId: agent.agentId,
                platform: agent.platform,
                name: agent.displayName,
                capabilities: agent.capabilities,
                status: agent.status === 'online' ? 'active' : 'offline'
            }));
        }
        catch (error) {
            logger.warn(`Failed to get agents for platform ${platformName}:`, {
                metadata: { error: error instanceof Error ? error.message : String(error) }
            });
            return [];
        }
    }
}
// Export the singleton instance
export const mcpRegistry = MCPRegistry.getInstance();
