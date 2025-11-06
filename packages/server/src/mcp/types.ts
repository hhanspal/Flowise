/**
 * Model Context Protocol (MCP) Types
 * 
 * This module defines the core types for the Model Context Protocol (MCP),
 * which provides a standardized interface for tools to be used by language models.
 */

/**
 * MCP Status Codes
 */
export enum MCPStatusCode {
  SUCCESS = 200,
  OK = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

/**
 * MCP Error Codes
 */
export enum MCPErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  EXECUTION_ERROR = 'EXECUTION_ERROR',
  SERVICE_ERROR = 'SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

/**
 * MCP Tool Information
 */
export interface MCPToolInfo {
  id: string;
  name: string;
  version: string;
}

/**
 * MCP Tool Parameter Schema Property
 */
export interface MCPParameterSchemaProperty {
  type: string;
  description: string;
  required?: boolean;
  enum?: string[];
  default?: any;
}

/**
 * MCP Parameter Schema
 */
export interface MCPParameterSchema {
  type: string;
  properties: Record<string, MCPParameterSchemaProperty>;
  required?: string[];
}

/**
 * MCP Return Schema
 */
export interface MCPReturnSchema {
  type: string;
  description: string;
  properties?: Record<string, any>;
}

/**
 * MCP Tool Definition - Enhanced for Multi-Platform Support
 */
export interface MCPToolDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: string[];
  parameters: MCPParameterSchema;
  returns: MCPReturnSchema;
  examples: Array<{
    description: string;
    request: Record<string, any>;
    response: {
      result: any;
      error?: any;
    };
  }>;
  auth_required: boolean;
  tags: string[];
  
  // Multi-platform extensions
  platform?: string;
  platformDisplayName?: string;
}

/**
 * MCP Request
 */
export interface MCPRequest {
  requestId: string;
  tool: MCPToolInfo;
  parameters: Record<string, any>;
  context?: {
    metadata?: Record<string, any>;
  };
}

/**
 * MCP Status
 */
export interface MCPStatus {
  code: MCPStatusCode;
  message: string;
}

/**
 * MCP Error
 */
export interface MCPError {
  code: string;
  message: string;
  details?: any;
}

/**
 * MCP Response
 */
export interface MCPResponse {
  requestId: string;
  status: MCPStatus;
  result?: any;
  error?: MCPError;
  metrics?: {
    processingTimeMs?: number;
    [key: string]: any;
  };
}

/**
 * MCP Tool Handler Function Type
 */
export type MCPToolHandler = (request: MCPRequest) => Promise<MCPResponse>;
