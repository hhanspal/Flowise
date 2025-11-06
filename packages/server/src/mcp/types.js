/**
 * Model Context Protocol (MCP) Types
 *
 * This module defines the core types for the Model Context Protocol (MCP),
 * which provides a standardized interface for tools to be used by language models.
 */
/**
 * MCP Status Codes
 */
export var MCPStatusCode;
(function (MCPStatusCode) {
    MCPStatusCode[MCPStatusCode["SUCCESS"] = 200] = "SUCCESS";
    MCPStatusCode[MCPStatusCode["OK"] = 200] = "OK";
    MCPStatusCode[MCPStatusCode["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    MCPStatusCode[MCPStatusCode["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    MCPStatusCode[MCPStatusCode["FORBIDDEN"] = 403] = "FORBIDDEN";
    MCPStatusCode[MCPStatusCode["NOT_FOUND"] = 404] = "NOT_FOUND";
    MCPStatusCode[MCPStatusCode["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
    MCPStatusCode[MCPStatusCode["SERVICE_UNAVAILABLE"] = 503] = "SERVICE_UNAVAILABLE";
})(MCPStatusCode || (MCPStatusCode = {}));
/**
 * MCP Error Codes
 */
export var MCPErrorCode;
(function (MCPErrorCode) {
    MCPErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    MCPErrorCode["AUTHENTICATION_ERROR"] = "AUTHENTICATION_ERROR";
    MCPErrorCode["AUTHORIZATION_ERROR"] = "AUTHORIZATION_ERROR";
    MCPErrorCode["RESOURCE_NOT_FOUND"] = "RESOURCE_NOT_FOUND";
    MCPErrorCode["EXECUTION_ERROR"] = "EXECUTION_ERROR";
    MCPErrorCode["SERVICE_ERROR"] = "SERVICE_ERROR";
    MCPErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
})(MCPErrorCode || (MCPErrorCode = {}));
