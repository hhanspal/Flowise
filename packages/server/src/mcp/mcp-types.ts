/**
 * Model Context Protocol (MCP) Types
 * 
 * This file contains type definitions for the Model Context Protocol,
 * which provides a standardized way for AI assistants to interact with tools.
 */

/**
 * MCP Tool Definition Interface
 * 
 * Defines the structure of a tool that can be registered with the MCP framework.
 */
export interface MCPToolDefinition {
  /**
   * Unique identifier for the tool
   */
  id: string;
  
  /**
   * Display name of the tool
   */
  name: string;
  
  /**
   * Detailed description of the tool's functionality
   */
  description: string;
  
  /**
   * Tool version
   */
  version: string;
  
  /**
   * Parameter schema for the tool
   */
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  
  /**
   * Additional metadata for the tool
   */
  metadata?: Record<string, any>;
}

/**
 * MCP Tool Handler Function Type
 * 
 * Type definition for tool handler functions that process MCP requests.
 */
export type MCPToolHandler = (request: any) => Promise<any>;

/**
 * MCP Tool Interface
 * 
 * Interface that all MCP tools should implement.
 */
export interface MCPTool {
  /**
   * Unique identifier for the tool
   */
  id: string;
  
  /**
   * Display name of the tool
   */
  name: string;
  
  /**
   * Detailed description of the tool's functionality
   */
  description: string;
  
  /**
   * Tool version
   */
  version: string;
  
  /**
   * Get the tool definition for MCP registration
   */
  getDefinition(): MCPToolDefinition;
  
  /**
   * Handle a request to the tool
   */
  handleRequest(request: any): Promise<any>;
}

/**
 * MCP Request Interface
 * 
 * Structure of a request to an MCP tool.
 */
export interface MCPRequest {
  /**
   * ID of the tool to invoke
   */
  toolId: string;
  
  /**
   * Parameters for the tool invocation
   */
  parameters: Record<string, any>;
  
  /**
   * Request context
   */
  context?: {
    /**
     * User ID for the request
     */
    userId?: string | number;
    
    /**
     * Organization or site ID for the request
     */
    organizationId?: string | number;
    
    /**
     * Assistant ID making the request
     */
    assistantId?: string;
    
    /**
     * Conversation or session ID
     */
    conversationId?: string;
    
    /**
     * Additional context data
     */
    [key: string]: any;
  };
}

/**
 * MCP Response Interface
 * 
 * Structure of a response from an MCP tool.
 */
export interface MCPResponse {
  /**
   * Status code
   */
  status: MCPStatusCode;
  
  /**
   * Response data
   */
  data?: any;
  
  /**
   * Error message (if applicable)
   */
  error?: string;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * MCP Status Codes
 * 
 * Standard status codes for MCP responses.
 */
export enum MCPStatusCode {
  SUCCESS = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  TOOL_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  SERVICE_UNAVAILABLE = 503
}

/**
 * MCP Tool Registry Interface
 * 
 * Interface for the registry that stores and manages MCP tools.
 */
export interface MCPToolRegistry {
  /**
   * Register a tool with the registry
   */
  registerTool(definition: MCPToolDefinition, handler: MCPToolHandler): void;
  
  /**
   * Get a tool definition by ID
   */
  getToolDefinition(toolId: string): MCPToolDefinition | undefined;
  
  /**
   * Get a tool handler by ID
   */
  getToolHandler(toolId: string): MCPToolHandler | undefined;
  
  /**
   * List all available tools
   */
  listTools(): MCPToolDefinition[];
  
  /**
   * Handle a request to a tool
   */
  handleRequest(request: MCPRequest): Promise<MCPResponse>;
}
