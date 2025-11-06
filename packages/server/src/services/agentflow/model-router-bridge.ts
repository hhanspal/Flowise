/**
 * ModelRouter Bridge for Flowise Integration
 *
 * This module provides a bridge between Flowise and the AgentFlowOS ModelRouter,
 * enabling SLM-first routing in Flowise applications.
 */

import { ModelRouter as RealModelRouter, modelRouter as realModelRouter } from '../../../server/ai/routing/model-router';

export interface ModelRouter {
  routeRequest(request: any): Promise<any>;
  executeWithModel(model: any, prompt: string, options: any): Promise<any>;
  generateEmbedding?(text: string): Promise<number[]>;
}

// Create a singleton instance that wraps the real ModelRouter
class ModelRouterBridge implements ModelRouter {
  private realRouter: RealModelRouter;

  constructor() {
    this.realRouter = realModelRouter;
  }

  async routeRequest(request: any): Promise<any> {
    try {
      // Convert Flowise request format to ModelRouter format
      const routingRequest = {
        prompt: request.task || request.prompt || '',
        options: {
          task: request.task || 'general',
          maxTokens: request.maxTokens || 1000
        }
      };

      const decision = await this.realRouter.routeRequest(routingRequest);

      // Convert back to Flowise expected format
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
    } catch (error) {
      console.error('ModelRouter bridge error:', error);
      // Fallback to stub behavior
      return {
        selectedModel: { name: 'deepseek-r1-distill-7b', provider: 'local' }
      };
    }
  }

  async executeWithModel(model: any, prompt: string, options: any): Promise<any> {
    try {
      return await this.realRouter.executeWithModel(model, prompt, options);
    } catch (error) {
      console.error('executeWithModel bridge error:', error);
      throw new Error('Model execution failed: ' + (error as Error).message);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      return await this.realRouter.generateEmbedding(text);
    } catch (error) {
      console.error('generateEmbedding bridge error:', error);
      // Fallback embedding
      return new Array(384).fill(0);
    }
  }
}

// Export singleton instance
export const modelRouterBridge = new ModelRouterBridge();