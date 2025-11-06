/**
 * SLM-First Model Router for Flowise Integration
 *
 * Standalone implementation of SLM-first routing optimized for Flowise agent workflows.
 * Prioritizes Small Language Models (SLMs) for cost-effective, fast inference while
 * falling back to Large Language Models (LLMs) for complex tasks.
 */

export interface ModelRoutingDecision {
  modelType: 'slm' | 'llm';
  specificModel: string;
  provider: string;
  reasoning: string;
  confidence: number;
  estimatedCost: number;
  estimatedLatency: number;
  fallbackOptions: string[];
}

export interface TaskComplexityMetrics {
  tokenCount: number;
  contextLength: number;
  requiresReasoning: boolean;
  requiresCreativity: boolean;
  requiresFactualAccuracy: boolean;
  hasStructuredOutput: boolean;
  isRepetitiveTask: boolean;
}

export interface RoutingPolicy {
  maxCostPerRequest: number;
  dailyCostBudget: number;
  maxLatencyMs: number;
  minAccuracyThreshold: number;
  slmFirst: boolean;
  allowLLMFallback: boolean;
  taskOverrides: Record<string, {
    forceModel?: 'slm' | 'llm';
    maxCost?: number;
    maxLatency?: number;
  }>;
}

export interface LLMRequest {
  prompt: string;
  options?: {
    task?: string;
    maxTokens?: number;
    responseFormat?: { type: string };
  };
}

export interface MCPRequest {
  toolId: string;
  parameters: any;
}

export interface AgentContext {
  agentId?: string;
  workflowId?: string;
  availableCapabilities?: string[];
  organizationId?: number;
  metadata?: Record<string, any>;
}

export class ModelRouter {
  private static instance: ModelRouter;
  private routingHistory: Map<string, ModelRoutingDecision[]> = new Map();
  private performanceMetrics: Map<string, any> = new Map();

  private defaultPolicy: RoutingPolicy = {
    maxCostPerRequest: 0.01,
    dailyCostBudget: 10.0,
    maxLatencyMs: 5000,
    minAccuracyThreshold: 0.85,
    slmFirst: true,
    allowLLMFallback: true,
    taskOverrides: {
      'real-time-chat': { maxLatency: 1000 },
      'simple-qa': { maxLatency: 1000, maxCost: 0.001 },
      'complex-reasoning': { maxLatency: 10000 },
      'creative-content': { maxLatency: 8000 }
    }
  };

  public static getInstance(): ModelRouter {
    if (!ModelRouter.instance) {
      ModelRouter.instance = new ModelRouter();
    }
    return ModelRouter.instance;
  }

  /**
   * Route a request to the most appropriate model
   */
  async routeRequest(
    request: LLMRequest | MCPRequest,
    context?: AgentContext,
    policy?: Partial<RoutingPolicy>
  ): Promise<ModelRoutingDecision> {
    const effectivePolicy = { ...this.defaultPolicy, ...policy };
    const taskType = this.extractTaskType(request);
    const complexity = this.analyzeComplexity(request);

    // Check for task-specific overrides
    const taskOverride = effectivePolicy.taskOverrides[taskType];
    if (taskOverride?.forceModel) {
      return this.createForcedDecision(taskOverride.forceModel, taskType, complexity);
    }

    // Apply SLM-first strategy
    if (effectivePolicy.slmFirst) {
      const slmDecision = await this.evaluateSLMSuitability(taskType, complexity, effectivePolicy);
      if (slmDecision.confidence >= effectivePolicy.minAccuracyThreshold) {
        return slmDecision;
      }
    }

    // Fallback to LLM if allowed and necessary
    if (effectivePolicy.allowLLMFallback) {
      return await this.evaluateLLMOption(taskType, complexity, effectivePolicy);
    }

    // Force SLM if no fallback allowed
    return await this.evaluateSLMSuitability(taskType, complexity, effectivePolicy, true);
  }

  /**
   * Analyze task complexity
   */
  private analyzeComplexity(request: LLMRequest | MCPRequest): TaskComplexityMetrics {
    const content = 'prompt' in request ? request.prompt : JSON.stringify(request.parameters);
    const tokenCount = this.estimateTokenCount(content);

    return {
      tokenCount,
      contextLength: this.estimateContextLength(request),
      requiresReasoning: this.detectReasoningRequirement(content),
      requiresCreativity: this.detectCreativityRequirement(content),
      requiresFactualAccuracy: this.detectFactualRequirement(content),
      hasStructuredOutput: this.detectStructuredOutput(request),
      isRepetitiveTask: this.detectRepetitiveTask(content)
    };
  }

  /**
   * Evaluate SLM suitability
   */
  private async evaluateSLMSuitability(
    taskType: string,
    complexity: TaskComplexityMetrics,
    policy: RoutingPolicy,
    forced: boolean = false
  ): Promise<ModelRoutingDecision> {
    const slmModels = this.getAvailableSLMs();
    const bestSLM = this.selectBestSLM(slmModels, taskType, complexity);

    let confidence = 0.9;

    if (complexity.tokenCount > 4000) confidence -= 0.2;
    if (complexity.requiresReasoning && !this.isSLMGoodAtReasoning(bestSLM)) confidence -= 0.3;
    if (complexity.requiresCreativity && taskType !== 'creative-content') confidence -= 0.2;

    if (complexity.isRepetitiveTask) confidence += 0.1;
    if (complexity.hasStructuredOutput) confidence += 0.1;
    if (taskType === 'simple-qa' || taskType === 'real-time-chat') confidence += 0.2;

    if (forced) confidence = Math.max(confidence, policy.minAccuracyThreshold);

    return {
      modelType: 'slm',
      specificModel: bestSLM.id,
      provider: 'local',
      reasoning: this.generateSLMReasoning(bestSLM, complexity, confidence),
      confidence: Math.max(0.1, Math.min(1.0, confidence)),
      estimatedCost: 0,
      estimatedLatency: this.estimateSLMLatency(bestSLM, complexity),
      fallbackOptions: ['openrouter-llm']
    };
  }

  /**
   * Evaluate LLM option
   */
  private async evaluateLLMOption(
    taskType: string,
    complexity: TaskComplexityMetrics,
    policy: RoutingPolicy
  ): Promise<ModelRoutingDecision> {
    const llmModels = this.getAvailableLLMs();
    const bestLLM = this.selectBestLLM(llmModels, taskType, complexity, policy);

    const estimatedCost = this.estimateLLMCost(bestLLM, complexity);
    const estimatedLatency = this.estimateLLMLatency(bestLLM, complexity);

    if (estimatedCost > policy.maxCostPerRequest) {
      throw new Error(`Estimated cost ${estimatedCost} exceeds max cost ${policy.maxCostPerRequest}`);
    }

    return {
      modelType: 'llm',
      specificModel: bestLLM.id,
      provider: 'openrouter',
      reasoning: this.generateLLMReasoning(bestLLM, complexity, estimatedCost),
      confidence: 0.95,
      estimatedCost,
      estimatedLatency,
      fallbackOptions: []
    };
  }

  /**
   * Get available SLM models
   */
  private getAvailableSLMs(): Array<{
    id: string;
    name: string;
    capabilities: string[];
    maxTokens: number;
    avgLatency: number;
  }> {
    return [
      {
        id: 'deepseek-r1-distill-7b',
        name: 'DeepSeek R1 Distill 7B',
        capabilities: ['reasoning', 'chat', 'coding', 'analysis'],
        maxTokens: 8192,
        avgLatency: 500
      },
      {
        id: 'phi-3-mini',
        name: 'Phi-3 Mini',
        capabilities: ['reasoning', 'chat', 'analysis'],
        maxTokens: 4096,
        avgLatency: 300
      }
    ];
  }

  /**
   * Get available LLM models
   */
  private getAvailableLLMs(): Array<{
    id: string;
    provider: string;
    costPer1kTokens: number;
    maxTokens: number;
    avgLatency: number;
  }> {
    return [
      {
        id: 'deepseek/deepseek-r1',
        provider: 'openrouter',
        costPer1kTokens: 0.14,
        maxTokens: 65536,
        avgLatency: 2000
      },
      {
        id: 'anthropic/claude-3.5-sonnet',
        provider: 'openrouter',
        costPer1kTokens: 3.0,
        maxTokens: 200000,
        avgLatency: 3000
      }
    ];
  }

  // Helper methods
  private extractTaskType(request: LLMRequest | MCPRequest): string {
    if ('options' in request && request.options?.task) {
      return request.options.task;
    }
    if ('toolId' in request) {
      return this.inferTaskFromTool(request.toolId);
    }
    return 'general';
  }

  private estimateTokenCount(content: string): number {
    return Math.ceil(content.length / 4);
  }

  private estimateContextLength(request: LLMRequest | MCPRequest): number {
    if ('messages' in request && (request as any).messages) {
      return (request as any).messages.reduce((total: number, msg: any) => total + this.estimateTokenCount(msg.content), 0);
    }
    return this.estimateTokenCount('prompt' in request ? request.prompt : JSON.stringify(request));
  }

  private detectReasoningRequirement(content: string): boolean {
    const keywords = ['analyze', 'compare', 'evaluate', 'reasoning', 'logic', 'solve', 'calculate'];
    return keywords.some(keyword => content.toLowerCase().includes(keyword));
  }

  private detectCreativityRequirement(content: string): boolean {
    const keywords = ['create', 'generate', 'creative', 'story', 'poem', 'design', 'brainstorm'];
    return keywords.some(keyword => content.toLowerCase().includes(keyword));
  }

  private detectFactualRequirement(content: string): boolean {
    const keywords = ['fact', 'accurate', 'precise', 'data', 'information', 'research'];
    return keywords.some(keyword => content.toLowerCase().includes(keyword));
  }

  private detectStructuredOutput(request: LLMRequest | MCPRequest): boolean {
    if ('options' in request && request.options?.responseFormat?.type === 'json_object') {
      return true;
    }
    const content = 'prompt' in request ? request.prompt : JSON.stringify(request);
    return content.toLowerCase().includes('json') || content.toLowerCase().includes('structured');
  }

  private detectRepetitiveTask(content: string): boolean {
    const keywords = ['format', 'transform', 'convert', 'extract', 'classify'];
    return keywords.some(keyword => content.toLowerCase().includes(keyword));
  }

  private selectBestSLM(models: any[], taskType: string, complexity: TaskComplexityMetrics): any {
    if (complexity.requiresReasoning) {
      return models.find(m => m.capabilities.includes('complex-reasoning')) || models[0];
    }
    if (taskType === 'real-time-chat') {
      return models.find(m => m.avgLatency < 500) || models[0];
    }
    return models[0];
  }

  private selectBestLLM(models: any[], taskType: string, complexity: TaskComplexityMetrics, policy: RoutingPolicy): any {
    const affordableModels = models.filter(m =>
      this.estimateLLMCost(m, complexity) <= policy.maxCostPerRequest
    );

    if (affordableModels.length === 0) {
      throw new Error('No LLM models within cost constraints');
    }

    if (complexity.requiresReasoning) {
      return affordableModels.find(m => m.id.includes('R1')) || affordableModels[0];
    }

    return affordableModels.sort((a, b) => a.costPer1kTokens - b.costPer1kTokens)[0];
  }

  private isSLMGoodAtReasoning(model: any): boolean {
    return model.capabilities.includes('reasoning') || model.capabilities.includes('complex-reasoning');
  }

  private estimateSLMLatency(model: any, complexity: TaskComplexityMetrics): number {
    const baseLatency = model.avgLatency;
    const tokenMultiplier = Math.max(1, complexity.tokenCount / 1000);
    return Math.ceil(baseLatency * tokenMultiplier);
  }

  private estimateLLMCost(model: any, complexity: TaskComplexityMetrics): number {
    const estimatedTokens = complexity.tokenCount + 500;
    return (estimatedTokens / 1000) * model.costPer1kTokens;
  }

  private estimateLLMLatency(model: any, complexity: TaskComplexityMetrics): number {
    const baseLatency = model.avgLatency;
    const tokenMultiplier = Math.max(1, complexity.tokenCount / 2000);
    return Math.ceil(baseLatency * tokenMultiplier);
  }

  private generateSLMReasoning(model: any, complexity: TaskComplexityMetrics, confidence: number): string {
    return `Selected SLM ${model.name} (confidence: ${(confidence * 100).toFixed(1)}%) - Cost-effective for ${complexity.isRepetitiveTask ? 'repetitive' : 'standard'} task`;
  }

  private generateLLMReasoning(model: any, complexity: TaskComplexityMetrics, cost: number): string {
    return `Selected LLM ${model.id} for complex task requiring ${complexity.requiresReasoning ? 'reasoning' : ''} ${complexity.requiresCreativity ? 'creativity' : ''} - estimated cost: $${cost.toFixed(4)}`;
  }

  private createForcedDecision(modelType: 'slm' | 'llm', taskType: string, complexity: TaskComplexityMetrics): ModelRoutingDecision {
    return {
      modelType,
      specificModel: modelType === 'slm' ? 'deepseek-r1-distill-7b' : 'deepseek/deepseek-r1',
      provider: modelType === 'slm' ? 'local' : 'openrouter',
      reasoning: `Forced ${modelType.toUpperCase()} selection by task override for ${taskType}`,
      confidence: 1.0,
      estimatedCost: modelType === 'slm' ? 0 : 0.01,
      estimatedLatency: modelType === 'slm' ? 500 : 2000,
      fallbackOptions: []
    };
  }

  private inferTaskFromTool(toolId: string): string {
    if (toolId.includes('chat') || toolId.includes('message')) return 'real-time-chat';
    if (toolId.includes('analyze') || toolId.includes('process')) return 'analysis';
    if (toolId.includes('create') || toolId.includes('generate')) return 'creative-content';
    return 'general';
  }

  /**
   * Execute with a specific model (Flowise compatibility)
   */
  async executeWithModel(model: any, prompt: string, options: any): Promise<any> {
    const modelId = typeof model === 'string' ? model : model.name || model.id;
    const provider = model.provider || 'openrouter';

    // For now, return a mock response - in production this would call actual APIs
    console.log(`Executing with model ${modelId} via ${provider}`);

    // Mock response based on prompt content
    if (prompt.toLowerCase().includes('decompose') || prompt.toLowerCase().includes('plan')) {
      return {
        content: JSON.stringify({
          subGoals: [
            {
              id: 'goal-1',
              description: 'Analyze requirements',
              tasks: [
                {
                  id: 'task-1',
                  name: 'Gather requirements',
                  description: 'Collect all requirements for the task',
                  type: 'atomic',
                  estimatedDuration: 30,
                  requiredCapabilities: ['analysis'],
                  priority: 'high',
                  successCriteria: ['Requirements documented']
                }
              ]
            }
          ],
          estimatedDuration: 60
        })
      };
    }

    return {
      content: `Mock response from ${modelId}: ${prompt.substring(0, 100)}...`
    };
  }

  /**
   * Generate embeddings for memory system
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Simple deterministic embedding for consistency
    const hash = this.simpleHash(text);
    const embedding: number[] = [];

    for (let i = 0; i < 384; i++) {
      embedding.push(Math.sin(hash + i) * 0.5 + 0.5);
    }

    return embedding;
  }

  private simpleHash(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  /**
   * Record performance for learning
   */
  recordPerformance(decision: ModelRoutingDecision, actualLatency: number, actualCost: number, success: boolean): void {
    const key = `${decision.modelType}-${decision.specificModel}`;
    const existing = this.performanceMetrics.get(key) || {
      avgLatency: 0,
      avgCost: 0,
      successRate: 0,
      lastUpdated: 0
    };

    const alpha = 0.1;
    existing.avgLatency = existing.avgLatency * (1 - alpha) + actualLatency * alpha;
    existing.avgCost = existing.avgCost * (1 - alpha) + actualCost * alpha;
    existing.successRate = existing.successRate * (1 - alpha) + (success ? 1 : 0) * alpha;
    existing.lastUpdated = Date.now();

    this.performanceMetrics.set(key, existing);
  }

  /**
   * Get routing statistics
   */
  getRoutingStats(): {
    totalRequests: number;
    slmUsagePercent: number;
    avgCostSavings: number;
    avgLatencyImprovement: number;
  } {
    const totalRequests = Array.from(this.routingHistory.values()).reduce((sum, decisions) => sum + decisions.length, 0);
    const slmRequests = Array.from(this.routingHistory.values())
      .flat()
      .filter(d => d.modelType === 'slm').length;

    return {
      totalRequests,
      slmUsagePercent: totalRequests > 0 ? (slmRequests / totalRequests) * 100 : 0,
      avgCostSavings: this.calculateAvgCostSavings(),
      avgLatencyImprovement: this.calculateAvgLatencyImprovement()
    };
  }

  private calculateAvgCostSavings(): number {
    const slmDecisions = Array.from(this.routingHistory.values()).flat().filter(d => d.modelType === 'slm');
    const avgLLMCost = 0.01;
    return slmDecisions.length > 0 ? avgLLMCost * slmDecisions.length : 0;
  }

  private calculateAvgLatencyImprovement(): number {
    const slmMetrics = Array.from(this.performanceMetrics.entries())
      .filter(([key]) => key.startsWith('slm'))
      .map(([, metrics]) => metrics.avgLatency);

    const llmMetrics = Array.from(this.performanceMetrics.entries())
      .filter(([key]) => key.startsWith('llm'))
      .map(([, metrics]) => metrics.avgLatency);

    if (slmMetrics.length === 0 || llmMetrics.length === 0) return 0;

    const avgSLMLatency = slmMetrics.reduce((sum, lat) => sum + lat, 0) / slmMetrics.length;
    const avgLLMLatency = llmMetrics.reduce((sum, lat) => sum + lat, 0) / llmMetrics.length;

    return avgLLMLatency - avgSLMLatency;
  }
}

// Export singleton instance
export const modelRouter = ModelRouter.getInstance();

// Flowise compatibility interface
export interface FlowiseModelRouter {
  routeRequest(request: any): Promise<any>;
  executeWithModel(model: any, prompt: string, options: any): Promise<any>;
  generateEmbedding(text: string): Promise<number[]>;
}

// Export Flowise-compatible interface
export const flowiseModelRouter: FlowiseModelRouter = {
  async routeRequest(request: any): Promise<any> {
    const decision = await modelRouter.routeRequest(request);
    return {
      selectedModel: {
        name: decision.specificModel,
        provider: decision.provider,
        id: decision.specificModel
      },
      reasoning: decision.reasoning,
      confidence: decision.confidence,
      estimatedCost: decision.estimatedCost,
      estimatedLatency: decision.estimatedLatency
    };
  },

  async executeWithModel(model: any, prompt: string, options: any): Promise<any> {
    return modelRouter.executeWithModel(model, prompt, options);
  },

  async generateEmbedding(text: string): Promise<number[]> {
    return modelRouter.generateEmbedding(text);
  }
};