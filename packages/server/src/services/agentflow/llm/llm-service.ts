/**
 * LLM Service Core Module
 * 
 * This module defines the interfaces and types for the AgentFlowOS LLM service system.
 * It enables the framework to communicate with different LLM providers (OpenAI, Anthropic, etc.)
 * through a unified interface.
 */

/**
 * LLM Service Configuration Interface
 */
export interface LLMServiceConfig {
  /**
   * Debug mode flag
   */
  debug?: boolean;
  
  /**
   * Custom provider-specific options
   */
  options?: Record<string, any>;
}

/**
 * Token Usage Information
 */
export interface TokenUsage {
  /**
   * Number of tokens in the prompt
   */
  prompt: number;
  
  /**
   * Number of tokens in the completion
   */
  completion: number;
  
  /**
   * Total tokens used (prompt + completion)
   */
  total: number;
}

/**
 * Model Request Options Interface
 */
export interface ModelRequestOptions {
  /**
   * Model ID to use for the request
   */
  model?: string;
  
  /**
   * Max tokens to generate in the response
   */
  max_tokens?: number;
  
  /**
   * Temperature for sampling
   */
  temperature?: number;
  
  /**
   * Other provider-specific options
   */
  [key: string]: any;
}

/**
 * Model Response Interface
 */
export interface ModelResponse {
  /**
   * Response text content
   */
  content: string;
  
  /**
   * Model that generated the response
   */
  model: string;
  
  /**
   * Provider that served the request
   */
  provider?: string;
  
  /**
   * Token usage information
   */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  
  /**
   * Response latency in milliseconds
   */
  latency: number;
  
  /**
   * Cost of the request
   */
  cost: number;
  
  /**
   * Response text (legacy compatibility)
   */
  text?: string;
}

/**
 * LLM Service Provider Interface
 * 
 * This interface must be implemented by all LLM service providers
 * to be used with the AgentFlowOS framework.
 */
export interface LLMServiceProvider {
  /**
   * Service provider ID (e.g., 'openai', 'anthropic')
   */
  readonly id: string;
  
  /**
   * Service provider display name
   */
  readonly name: string;
  
  /**
   * Default model ID
   */
  readonly model: string;
  
  /**
   * Check if the service is available
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * List available models
   */
  listModels(): Promise<string[]>;
  
  /**
   * Send a completion request
   * 
   * @param prompt Text prompt
   * @param options Request options
   */
  sendCompletion(prompt: string, options?: ModelRequestOptions): Promise<ModelResponse>;
  
  /**
   * Send a chat completion request
   * 
   * @param messages Array of messages
   * @param options Request options
   */
  sendChatCompletion(messages: { role: string; content: string }[], options?: ModelRequestOptions): Promise<ModelResponse>;
  
  /**
   * Generate streaming response (optional)
   */
  generateStreamResponse?(prompt: string, options?: ModelRequestOptions): AsyncIterableIterator<ModelResponse>;
  
  /**
   * Validate connection to the service (optional)
   */
  validateConnection?(): Promise<boolean>;
}

/**
 * Model Performance Metrics Interface
 */
export interface ModelPerformanceMetrics {
  /**
   * Model ID
   */
  modelId: string;
  
  /**
   * Provider ID
   */
  providerId: string;
  
  /**
   * Cost per 1000 tokens (in cents)
   */
  costPer1kTokens: number;
  
  /**
   * Average latency (in milliseconds)
   */
  avgLatencyMs: number;
  
  /**
   * Average accuracy score (0-1)
   */
  avgAccuracy: number;
  
  /**
   * Tokens per second throughput
   */
  tokensPerSecond: number;
  
  /**
   * Context window size (in tokens)
   */
  contextSize: number;
  
  /**
   * Model capabilities (e.g., ['text', 'code', 'vision'])
   */
  capabilities: string[];
}

/**
 * Model Selection Strategy Interface
 */
export interface ModelSelectionStrategy {
  /**
   * Select the best model based on requirements
   * 
   * @param providers Available LLM service providers
   * @param requirements Model requirements
   * @param metrics Performance metrics for each model
   * @returns The selected provider and model
   */
  selectModel(
    providers: LLMServiceProvider[],
    requirements: {
      task: string;
      prioritize?: 'speed' | 'cost' | 'accuracy';
      minAccuracy?: number;
      maxLatency?: number;
      maxCost?: number;
      requiredCapabilities?: string[];
    },
    metrics: Record<string, ModelPerformanceMetrics>
  ): Promise<{ provider: LLMServiceProvider; model: string }>;
}

/**
 * LLM Service Factory Interface
 */
export interface LLMServiceFactory {
  /**
   * Create a service provider
   * 
   * @param type Provider type (e.g., 'openai', 'anthropic')
   * @param config Provider configuration
   * @returns LLM service provider
   */
  createProvider(type: string, config: LLMServiceConfig): LLMServiceProvider;
  
  /**
   * Check if a provider type is supported
   * 
   * @param type Provider type to check
   * @returns True if the provider type is supported
   */
  supportsProvider(type: string): boolean;
  
  /**
   * List all supported provider types
   * 
   * @returns Array of supported provider types
   */
  getSupportedProviders(): string[];
}

/**
 * LLM Service Manager Interface
 */
export interface LLMServiceManager {
  /**
   * Register a service provider
   * 
   * @param provider Service provider to register
   * @returns The registered provider
   */
  registerProvider(provider: LLMServiceProvider): LLMServiceProvider;
  
  /**
   * Unregister a service provider
   * 
   * @param providerId Provider ID to unregister
   * @returns True if the provider was unregistered
   */
  unregisterProvider(providerId: string): boolean;
  
  /**
   * Get a service provider by ID
   * 
   * @param providerId Provider ID to get
   * @returns The requested provider or undefined if not found
   */
  getProvider(providerId: string): LLMServiceProvider | undefined;
  
  /**
   * List all registered service providers
   * 
   * @returns Array of registered providers
   */
  listProviders(): LLMServiceProvider[];
  
  /**
   * Register a model selection strategy
   * 
   * @param name Strategy name
   * @param strategy Model selection strategy to register
   * @returns The registered strategy
   */
  registerSelectionStrategy(name: string, strategy: ModelSelectionStrategy): ModelSelectionStrategy;
  
  /**
   * Get a model selection strategy by name
   * 
   * @param name Strategy name
   * @returns The requested strategy or undefined if not found
   */
  getSelectionStrategy(name: string): ModelSelectionStrategy | undefined;
  
  /**
   * Select the best model for a given task using a specific strategy
   * 
   * @param task Task description
   * @param options Selection options
   * @returns The selected provider and model
   */
  selectModel(
    task: string,
    options?: {
      strategy?: string;
      prioritize?: 'speed' | 'cost' | 'accuracy';
      minAccuracy?: number;
      maxLatency?: number;
      maxCost?: number;
      requiredCapabilities?: string[];
      preferredProvider?: string;
      preferredModel?: string;
    }
  ): Promise<{ provider: LLMServiceProvider; model: string }>;
  
  /**
   * Send a completion request to the default or specified provider
   * 
   * @param prompt Text prompt
   * @param options Request options
   * @returns Model response
   */
  sendCompletion(
    prompt: string,
    options?: ModelRequestOptions & {
      provider?: string;
    }
  ): Promise<ModelResponse>;
  
  /**
   * Send a chat completion request to the default or specified provider
   * 
   * @param messages Array of messages
   * @param options Request options
   * @returns Model response
   */
  sendChatCompletion(
    messages: { role: string; content: string }[],
    options?: ModelRequestOptions & {
      provider?: string;
    }
  ): Promise<ModelResponse>;
  
  /**
   * Record performance metrics for a model
   * 
   * @param providerId Provider ID
   * @param modelId Model ID
   * @param metrics Performance metrics
   */
  recordModelMetrics(providerId: string, modelId: string, metrics: Partial<ModelPerformanceMetrics>): void;
  
  /**
   * Get performance metrics for a model
   * 
   * @param providerId Provider ID
   * @param modelId Model ID
   * @returns Performance metrics
   */
  getModelMetrics(providerId: string, modelId: string): ModelPerformanceMetrics | undefined;
  
  /**
   * List performance metrics for all models
   * 
   * @returns Record of all metrics by provider and model
   */
  listModelMetrics(): Record<string, Record<string, ModelPerformanceMetrics>>;
}