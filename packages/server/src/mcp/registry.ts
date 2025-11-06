/**
 * MCP Registry
 * 
 * This module provides a registry for MCP tools, allowing tools to be registered,
 * discovered, and used by agents and other components.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  MCPToolDefinition,
  MCPToolHandler,
  MCPRequest,
  MCPResponse,
  MCPStatusCode,
  MCPErrorCode
} from './types';
import logger from '../utils/logger';

/**
 * Platform Configuration for MCP connections
 */
export interface PlatformMCPConfig {
  name: string;
  displayName: string;
  transport: 'stdio' | 'http' | 'websocket';
  endpoint?: string;
  command?: string;
  args?: string[];
  authentication?: {
    type: 'bearer' | 'api-key' | 'oauth2';
    token?: string;
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
  };
  capabilities?: string[];
  enabled: boolean;
}

/**
 * MCP Connection for external platforms
 */
export interface MCPConnection {
  id: string;
  platform: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  capabilities: {
    tools: boolean;
    resources: boolean;
    prompts: boolean;
    listChanged?: boolean;
  };
  tools: MCPToolDefinition[];
  lastConnected?: Date;
  error?: string;
}

/**
 * Platform capabilities discovered via MCP
 */
export interface PlatformCapabilities {
  platform: string;
  tools: MCPToolDefinition[];
  resources: any[];
  prompts: any[];
  agents?: any[];
}

/**
 * Cross-platform agent identity
 */
export interface CrossPlatformAgentIdentity {
  agentId: string;
  platform: string;
  name: string;
  capabilities: string[];
  status: 'active' | 'idle' | 'busy' | 'offline';
}

/**
 * MCP Registry Interface - Enhanced for Multi-Platform Support
 */
export interface IMCPRegistry {
  // Original tool registration methods
  registerTool(definition: MCPToolDefinition, handler: MCPToolHandler): void;
  unregisterTool(toolId: string): boolean;
  getToolDefinition(toolId: string): MCPToolDefinition | undefined;
  getToolHandler(toolId: string): MCPToolHandler | undefined;
  getAllToolDefinitions(): MCPToolDefinition[];
  getAllTools(): { definition: MCPToolDefinition, handler: MCPToolHandler }[];
  getToolsByCapability(capability: string): MCPToolDefinition[];
  getToolsByTag(tag: string): MCPToolDefinition[];
  callTool(toolId: string, parameters: Record<string, any>, context?: Record<string, any>): Promise<MCPResponse>;
  
  // Multi-platform methods
  registerPlatform(config: PlatformMCPConfig): Promise<void>;
  unregisterPlatform(platformName: string): Promise<void>;
  getPlatformConnection(platformName: string): MCPConnection | undefined;
  getAllPlatforms(): MCPConnection[];
  discoverPlatformCapabilities(platformName: string): Promise<PlatformCapabilities>;
  getToolsByPlatform(platformName: string): MCPToolDefinition[];
  callPlatformTool(platformName: string, toolName: string, parameters: Record<string, any>): Promise<MCPResponse>;
  
  // Agent discovery methods
  discoverAgents(platformName?: string): Promise<CrossPlatformAgentIdentity[]>;
  getAgentsByPlatform(platformName: string): Promise<CrossPlatformAgentIdentity[]>;
}

/**
 * MCP Registry Implementation - Enhanced for Multi-Platform Support
 */
export class MCPRegistry implements IMCPRegistry {
  private static instance: MCPRegistry;
  private toolDefinitions: Map<string, MCPToolDefinition> = new Map();
  private toolHandlers: Map<string, MCPToolHandler> = new Map();
  
  // Multi-platform support
  private platformConnections: Map<string, MCPConnection> = new Map();
  private platformConfigs: Map<string, PlatformMCPConfig> = new Map();
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): MCPRegistry {
    if (!MCPRegistry.instance) {
      MCPRegistry.instance = new MCPRegistry();
    }
    return MCPRegistry.instance;
  }
  
  /**
   * Register a tool with the registry
   */
  public registerTool(definition: MCPToolDefinition, handler: MCPToolHandler): void {
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
    } catch (error: unknown) {
      console.error(`Failed to register tool ${definition.id}:`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Unregister a tool from the registry
   */
  public unregisterTool(toolId: string): boolean {
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
  public getToolDefinition(toolId: string): MCPToolDefinition | undefined {
    return this.toolDefinitions.get(toolId);
  }
  
  /**
   * Get a tool handler by ID
   */
  public getToolHandler(toolId: string): MCPToolHandler | undefined {
    return this.toolHandlers.get(toolId);
  }
  
  /**
   * Get all tool definitions
   */
  public getAllToolDefinitions(): MCPToolDefinition[] {
    return Array.from(this.toolDefinitions.values());
  }
  
  /**
   * Get all tools (definitions and handlers)
   */
  public getAllTools(): { definition: MCPToolDefinition, handler: MCPToolHandler }[] {
    return this.getAllToolDefinitions().map(definition => ({
      definition,
      handler: this.toolHandlers.get(definition.id)!
    }));
  }
  
  /**
   * Get tools by capability
   */
  public getToolsByCapability(capability: string): MCPToolDefinition[] {
    return this.getAllToolDefinitions().filter(definition => 
      definition.capabilities.includes(capability)
    );
  }
  
  /**
   * Get tools by tag
   */
  public getToolsByTag(tag: string): MCPToolDefinition[] {
    return this.getAllToolDefinitions().filter(definition => 
      definition.tags.includes(tag)
    );
  }
  
  /**
   * Call a tool with the given parameters
   */
  public async callTool(
    toolId: string, 
    parameters: Record<string, any>,
    context?: Record<string, any>
  ): Promise<MCPResponse> {
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
      const request: MCPRequest = {
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
    } catch (error: unknown) {
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
  public async registerPlatform(config: PlatformMCPConfig): Promise<void> {
    try {
      console.log(`Registering platform: ${config.name}`);
      
      // Store the configuration
      this.platformConfigs.set(config.name, config);
      
      // Create connection object
      const connection: MCPConnection = {
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
          const platformTool: MCPToolDefinition = {
            ...tool,
            id: `${config.name}:${tool.id}`,
            platform: config.name
          };
          
          // Create a handler that routes to the platform
          const platformHandler: MCPToolHandler = async (request: MCPRequest) => {
            return await this.callPlatformTool(config.name, tool.id, request.parameters || {});
          };
          
          this.registerTool(platformTool, platformHandler);
        });
        
        console.log(`Platform ${config.name} connected successfully with ${capabilities.tools.length} tools`);
      } catch (error) {
        connection.status = 'error';
        connection.error = error instanceof Error ? error.message : String(error);
        console.error(`Failed to connect to platform ${config.name}:`, error);
      }
    } catch (error) {
      console.error(`Failed to register platform ${config.name}:`, error);
      throw error;
    }
  }
  
  /**
   * Unregister a platform
   */
  public async unregisterPlatform(platformName: string): Promise<void> {
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
    } catch (error) {
      console.error(`Failed to unregister platform ${platformName}:`, error);
      throw error;
    }
  }
  
  /**
   * Get platform connection info
   */
  public getPlatformConnection(platformName: string): MCPConnection | undefined {
    return this.platformConnections.get(platformName);
  }
  
  /**
   * Get all platform connections
   */
  public getAllPlatforms(): MCPConnection[] {
    return Array.from(this.platformConnections.values());
  }
  
  /**
   * Discover capabilities of a platform
   */
  public async discoverPlatformCapabilities(platformName: string): Promise<PlatformCapabilities> {
    const config = this.platformConfigs.get(platformName);
    if (!config) {
      throw new Error(`Platform ${platformName} not found`);
    }
    
    // TODO: Implement actual MCP client for platform discovery
    logger.warn(`Platform capability discovery not implemented for ${platformName}, returning empty capabilities`);
    
    // Return empty capabilities
    const emptyCapabilities: PlatformCapabilities = {
      platform: platformName,
      tools: [],
      resources: [],
      prompts: [],
      agents: []
    };

    return emptyCapabilities;
  }  /**
   * Get tools for a specific platform
   */
  public getToolsByPlatform(platformName: string): MCPToolDefinition[] {
    return this.getAllToolDefinitions().filter(tool => tool.platform === platformName);
  }
  
  /**
   * Call a tool on a specific platform
   */
  public async callPlatformTool(
    platformName: string,
    toolName: string,
    parameters: Record<string, any>
  ): Promise<MCPResponse> {
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
    
    // TODO: Implement actual MCP client for tool calling
    logger.error(`Platform tool calling not implemented for ${platformName}:${toolName}`);
    
    return {
      requestId: uuidv4(),
      status: {
        code: MCPStatusCode.INTERNAL_SERVER_ERROR,
        message: 'Tool execution failed'
      },
      error: {
        code: MCPErrorCode.EXECUTION_ERROR,
        message: `Platform tool calling not implemented`
      }
    };
  }
  
  /**
   * Discover agents across platforms
   */
  public async discoverAgents(platformName?: string): Promise<CrossPlatformAgentIdentity[]> {
    const agents: CrossPlatformAgentIdentity[] = [];
    
    if (platformName) {
      // Discover agents for specific platform
      const platformAgents = await this.getAgentsByPlatform(platformName);
      agents.push(...platformAgents);
    } else {
      // Discover agents across all platforms
      const platforms = Array.from(this.platformConnections.keys());
      for (const platform of platforms) {
        try {
          const platformAgents = await this.getAgentsByPlatform(platform);
          agents.push(...platformAgents);
        } catch (error) {
          console.warn(`Failed to discover agents for platform ${platform}:`, error);
        }
      }
    }
    
    return agents;
  }
  
  /**
   * Get agents for a specific platform
   */
  public async getAgentsByPlatform(platformName: string): Promise<CrossPlatformAgentIdentity[]> {
    const connection = this.platformConnections.get(platformName);
    if (!connection || connection.status !== 'connected') {
      return [];
    }
    
    // TODO: Implement agent discovery service
    logger.warn(`Agent discovery not implemented for platform ${platformName}`);
    return [];
  }
}

// Export the singleton instance
export const mcpRegistry = MCPRegistry.getInstance();
