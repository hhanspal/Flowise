/**
 * Agent Memory System
 * 
 * Implements episodic, semantic, and working memory for autonomous agents
 * to enable learning, context retention, and knowledge accumulation.
 */

import { v4 as uuidv4 } from 'uuid';
import { flowiseModelRouter } from './model-router';

// Stub interfaces for Flowise integration
interface AgentContext {
  agentId?: string;
  workflowId?: string;
  availableCapabilities?: string[];
  organizationId?: number;
  metadata?: Record<string, any>;
}

interface ModelRouter {
  routeRequest(request: any): Promise<any>;
  executeWithModel(model: any, prompt: string, options: any): Promise<any>;
  generateEmbedding(text: string): Promise<number[]>;
}

import logger from '../../utils/logger';

export interface AgentExperience {
  id: string;
  agentId: string;
  experienceType: 'task_execution' | 'interaction' | 'learning' | 'error' | 'success';
  context: AgentContext;
  input: any;
  output: any;
  outcome: 'success' | 'failure' | 'partial';
  successScore: number;
  duration: number;
  cost: number;
  metadata: Record<string, any>;
  timestamp: Date;
  embedding?: number[];
}

export interface KnowledgeItem {
  id: string;
  agentId: string;
  knowledgeType: 'fact' | 'procedure' | 'pattern' | 'preference' | 'constraint';
  concept: string;
  content: any;
  confidenceScore: number;
  source: string;
  validatedBy: string[];
  contradictions: string[];
  relatedConcepts: string[];
  createdAt: Date;
  updatedAt: Date;
  accessCount: number;
}

export interface WorkingContext {
  sessionId: string;
  conversationId: string;
  currentGoal?: string;
  activeEntities: Record<string, any>;
  contextStack: any[];
  temporaryFacts: Record<string, any>;
  attentionFocus: string[];
  workingMemoryCapacity: number;
  lastUpdated: Date;
}

export interface MemoryQuery {
  agentId: string;
  experienceType?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  contextSimilarity?: AgentContext;
  outcomeFilter?: 'success' | 'failure' | 'partial';
  limit?: number;
  minSuccessScore?: number;
}

export interface MemorySearchResult {
  experience: AgentExperience;
  similarityScore: number;
  relevanceReason: string;
}

export interface KnowledgeQuery {
  concept?: string;
  knowledgeType?: string;
  minConfidence?: number;
  relatedTo?: string;
  limit?: number;
}

export class AgentMemorySystem {
  private static instance: AgentMemorySystem;
  private modelRouter: ModelRouter;
  
  // In-memory storage (would be replaced with persistent storage)
  private episodicMemory: Map<string, AgentExperience[]> = new Map();
  private semanticMemory: Map<string, KnowledgeItem[]> = new Map();
  private workingMemory: Map<string, WorkingContext> = new Map();
  
  // Memory statistics
  private memoryStats: Map<string, any> = new Map();

  private constructor() {
    this.modelRouter = flowiseModelRouter;
    this.initializeMemorySystem();
  }

  public static getInstance(): AgentMemorySystem {
    if (!AgentMemorySystem.instance) {
      AgentMemorySystem.instance = new AgentMemorySystem();
    }
    return AgentMemorySystem.instance;
  }

  private initializeMemorySystem(): void {
    logger.info('Initializing Agent Memory System');
    
    // Start periodic memory maintenance
    setInterval(() => {
      this.performMemoryMaintenance();
    }, 300000); // Every 5 minutes
  }

  // Episodic Memory Methods

  /**
   * Store a new experience in episodic memory
   */
  async storeExperience(experience: AgentExperience): Promise<void> {
    try {
      // Generate embedding for similarity search
      if (!experience.embedding) {
        experience.embedding = await this.generateEmbedding(experience);
      }

      // Store experience
      const agentExperiences = this.episodicMemory.get(experience.agentId) || [];
      agentExperiences.push(experience);
      this.episodicMemory.set(experience.agentId, agentExperiences);

      // Update statistics
      this.updateMemoryStats(experience.agentId, 'episodic', 'store');

      // Extract knowledge from experience
      await this.extractKnowledgeFromExperience(experience);

      logger.debug(`Stored experience ${experience.id} for agent ${experience.agentId}`);

    } catch (error) {
      logger.error('Failed to store experience:', error);
      throw error;
    }
  }

  /**
   * Retrieve experiences based on query
   */
  async retrieveExperiences(query: MemoryQuery): Promise<AgentExperience[]> {
    try {
      const agentExperiences = this.episodicMemory.get(query.agentId) || [];
      let filteredExperiences = agentExperiences;

      // Apply filters
      if (query.experienceType) {
        filteredExperiences = filteredExperiences.filter(
          exp => exp.experienceType === query.experienceType
        );
      }

      if (query.timeRange) {
        filteredExperiences = filteredExperiences.filter(
          exp => exp.timestamp >= query.timeRange!.start && 
                 exp.timestamp <= query.timeRange!.end
        );
      }

      if (query.outcomeFilter) {
        filteredExperiences = filteredExperiences.filter(
          exp => exp.outcome === query.outcomeFilter
        );
      }

      if (query.minSuccessScore) {
        filteredExperiences = filteredExperiences.filter(
          exp => exp.successScore >= query.minSuccessScore!
        );
      }

      // Sort by timestamp (most recent first)
      filteredExperiences.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply limit
      if (query.limit) {
        filteredExperiences = filteredExperiences.slice(0, query.limit);
      }

      // Update access statistics
      this.updateMemoryStats(query.agentId, 'episodic', 'retrieve');

      return filteredExperiences;

    } catch (error) {
      logger.error('Failed to retrieve experiences:', error);
      throw error;
    }
  }

  /**
   * Find similar experiences based on context
   */
  async findSimilarExperiences(context: AgentContext): Promise<MemorySearchResult[]> {
    try {
      const agentExperiences = this.episodicMemory.get(context.agentId || 'default') || [];
      const results: MemorySearchResult[] = [];

      // Generate embedding for current context
      const contextEmbedding = await this.generateContextEmbedding(context);

      for (const experience of agentExperiences) {
        if (experience.embedding) {
          const similarity = this.calculateCosineSimilarity(
            contextEmbedding, 
            experience.embedding
          );

          if (similarity > 0.7) { // Similarity threshold
            results.push({
              experience,
              similarityScore: similarity,
              relevanceReason: this.generateRelevanceReason(context, experience)
            });
          }
        }
      }

      // Sort by similarity score
      results.sort((a, b) => b.similarityScore - a.similarityScore);

      return results.slice(0, 10); // Return top 10 similar experiences

    } catch (error) {
      logger.error('Failed to find similar experiences:', error);
      throw error;
    }
  }

  // Semantic Memory Methods

  /**
   * Store knowledge in semantic memory
   */
  async storeKnowledge(knowledge: KnowledgeItem): Promise<void> {
    try {
      const agentKnowledge = this.semanticMemory.get(knowledge.agentId) || [];
      
      // Check for existing knowledge about the same concept
      const existingIndex = agentKnowledge.findIndex(
        item => item.concept === knowledge.concept && 
                item.knowledgeType === knowledge.knowledgeType
      );

      if (existingIndex >= 0) {
        // Update existing knowledge
        const existing = agentKnowledge[existingIndex];
        existing.content = knowledge.content;
        existing.confidenceScore = Math.max(existing.confidenceScore, knowledge.confidenceScore);
        existing.updatedAt = new Date();
        existing.accessCount++;
        
        // Merge related concepts
        existing.relatedConcepts = [...new Set([
          ...existing.relatedConcepts,
          ...knowledge.relatedConcepts
        ])];
      } else {
        // Add new knowledge
        agentKnowledge.push(knowledge);
      }

      this.semanticMemory.set(knowledge.agentId, agentKnowledge);
      this.updateMemoryStats(knowledge.agentId, 'semantic', 'store');

      logger.debug(`Stored knowledge about ${knowledge.concept} for agent ${knowledge.agentId}`);

    } catch (error) {
      logger.error('Failed to store knowledge:', error);
      throw error;
    }
  }

  /**
   * Query knowledge from semantic memory
   */
  async queryKnowledge(agentId: string, query: KnowledgeQuery): Promise<KnowledgeItem[]> {
    try {
      const agentKnowledge = this.semanticMemory.get(agentId) || [];
      let results = agentKnowledge;

      // Apply filters
      if (query.concept) {
        results = results.filter(item => 
          item.concept.toLowerCase().includes(query.concept!.toLowerCase()) ||
          item.relatedConcepts.some(concept => 
            concept.toLowerCase().includes(query.concept!.toLowerCase())
          )
        );
      }

      if (query.knowledgeType) {
        results = results.filter(item => item.knowledgeType === query.knowledgeType);
      }

      if (query.minConfidence) {
        results = results.filter(item => item.confidenceScore >= query.minConfidence!);
      }

      if (query.relatedTo) {
        results = results.filter(item => 
          item.relatedConcepts.includes(query.relatedTo!)
        );
      }

      // Sort by confidence and access count
      results.sort((a, b) => {
        const scoreA = a.confidenceScore * 0.7 + (a.accessCount / 100) * 0.3;
        const scoreB = b.confidenceScore * 0.7 + (b.accessCount / 100) * 0.3;
        return scoreB - scoreA;
      });

      // Update access counts
      results.forEach(item => item.accessCount++);

      // Apply limit
      if (query.limit) {
        results = results.slice(0, query.limit);
      }

      this.updateMemoryStats(agentId, 'semantic', 'query');
      return results;

    } catch (error) {
      logger.error('Failed to query knowledge:', error);
      throw error;
    }
  }

  /**
   * Update existing knowledge
   */
  async updateKnowledge(agentId: string, id: string, updates: Partial<KnowledgeItem>): Promise<void> {
    try {
      const agentKnowledge = this.semanticMemory.get(agentId) || [];
      const itemIndex = agentKnowledge.findIndex(item => item.id === id);

      if (itemIndex >= 0) {
        const item = agentKnowledge[itemIndex];
        Object.assign(item, updates);
        item.updatedAt = new Date();
        
        logger.debug(`Updated knowledge ${id} for agent ${agentId}`);
      } else {
        throw new Error(`Knowledge item ${id} not found for agent ${agentId}`);
      }

    } catch (error) {
      logger.error('Failed to update knowledge:', error);
      throw error;
    }
  }

  // Working Memory Methods

  /**
   * Set working context for an agent
   */
  setContext(agentId: string, context: WorkingContext): void {
    try {
      // Enforce working memory capacity
      if (context.contextStack.length > context.workingMemoryCapacity) {
        context.contextStack = context.contextStack.slice(-context.workingMemoryCapacity);
      }

      if (context.attentionFocus.length > 5) { // Max 5 focus items
        context.attentionFocus = context.attentionFocus.slice(-5);
      }

      context.lastUpdated = new Date();
      this.workingMemory.set(agentId, context);

      logger.debug(`Set working context for agent ${agentId}`);

    } catch (error) {
      logger.error('Failed to set working context:', error);
      throw error;
    }
  }

  /**
   * Get working context for an agent
   */
  getContext(agentId: string): WorkingContext | undefined {
    return this.workingMemory.get(agentId);
  }

  /**
   * Update working context
   */
  updateContext(agentId: string, updates: Partial<WorkingContext>): void {
    try {
      const context = this.workingMemory.get(agentId);
      if (context) {
        Object.assign(context, updates);
        context.lastUpdated = new Date();
        
        // Enforce capacity limits
        if (context.contextStack.length > context.workingMemoryCapacity) {
          context.contextStack = context.contextStack.slice(-context.workingMemoryCapacity);
        }
      }

    } catch (error) {
      logger.error('Failed to update working context:', error);
      throw error;
    }
  }

  /**
   * Clear working context
   */
  clearContext(agentId: string): void {
    this.workingMemory.delete(agentId);
    logger.debug(`Cleared working context for agent ${agentId}`);
  }

  // Utility Methods

  /**
   * Get memory statistics for an agent
   */
  getMemoryStats(agentId: string): any {
    const episodicCount = this.episodicMemory.get(agentId)?.length || 0;
    const semanticCount = this.semanticMemory.get(agentId)?.length || 0;
    const hasWorkingContext = this.workingMemory.has(agentId);
    const stats = this.memoryStats.get(agentId) || {};

    return {
      episodicMemorySize: episodicCount,
      semanticMemorySize: semanticCount,
      hasWorkingContext,
      totalExperiences: episodicCount,
      totalKnowledge: semanticCount,
      memoryOperations: stats,
      memoryHealth: this.calculateMemoryHealth(agentId)
    };
  }

  /**
   * Consolidate memories (move from episodic to semantic)
   */
  async consolidateMemories(agentId: string): Promise<void> {
    try {
      const experiences = this.episodicMemory.get(agentId) || [];
      const recentExperiences = experiences.filter(
        exp => Date.now() - exp.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
      );

      // Extract patterns and knowledge from recent experiences
      for (const experience of recentExperiences) {
        await this.extractKnowledgeFromExperience(experience);
      }

      logger.info(`Consolidated memories for agent ${agentId}`);

    } catch (error) {
      logger.error('Failed to consolidate memories:', error);
      throw error;
    }
  }

  // Private Helper Methods

  private async generateEmbedding(experience: AgentExperience): Promise<number[]> {
    try {
      // Create text representation of experience
      const text = `${experience.experienceType} ${JSON.stringify(experience.input)} ${JSON.stringify(experience.output)} ${experience.outcome}`;
      
      // Use SLM for embedding generation (simplified)
      const embedding = await this.modelRouter.generateEmbedding(text);
      return embedding;

    } catch (error) {
      logger.error('Failed to generate embedding:', error);
      // Return random embedding as fallback
      return Array.from({ length: 384 }, () => Math.random());
    }
  }

  private async generateContextEmbedding(context: AgentContext): Promise<number[]> {
    try {
      const text = `${context.agentId} ${context.workflowId} ${JSON.stringify(context.metadata)}`;
      return await this.modelRouter.generateEmbedding(text);
    } catch (error) {
      return Array.from({ length: 384 }, () => Math.random());
    }
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private generateRelevanceReason(context: AgentContext, experience: AgentExperience): string {
    const reasons = [];

    if (context.agentId === experience.agentId) {
      reasons.push('Same agent');
    }

    if (context.workflowId === experience.context.workflowId) {
      reasons.push('Same workflow');
    }

    if (experience.outcome === 'success') {
      reasons.push('Successful experience');
    }

    return reasons.join(', ') || 'Similar context';
  }

  private async extractKnowledgeFromExperience(experience: AgentExperience): Promise<void> {
    try {
      // Extract patterns and knowledge from successful experiences
      if (experience.outcome === 'success' && experience.successScore > 0.8) {
        
        // Extract procedural knowledge
        const proceduralKnowledge: KnowledgeItem = {
          id: uuidv4(),
          agentId: experience.agentId,
          knowledgeType: 'procedure',
          concept: `${experience.experienceType}_procedure`,
          content: {
            input: experience.input,
            output: experience.output,
            context: experience.context
          },
          confidenceScore: experience.successScore,
          source: `experience_${experience.id}`,
          validatedBy: [],
          contradictions: [],
          relatedConcepts: [experience.experienceType],
          createdAt: new Date(),
          updatedAt: new Date(),
          accessCount: 0
        };

        await this.storeKnowledge(proceduralKnowledge);

        // Extract preference knowledge if applicable
        if (experience.metadata.userFeedback) {
          const preferenceKnowledge: KnowledgeItem = {
            id: uuidv4(),
            agentId: experience.agentId,
            knowledgeType: 'preference',
            concept: 'user_preferences',
            content: experience.metadata.userFeedback,
            confidenceScore: 0.9,
            source: `experience_${experience.id}`,
            validatedBy: [],
            contradictions: [],
            relatedConcepts: ['user_interaction'],
            createdAt: new Date(),
            updatedAt: new Date(),
            accessCount: 0
          };

          await this.storeKnowledge(preferenceKnowledge);
        }
      }

    } catch (error) {
      logger.error('Failed to extract knowledge from experience:', error);
    }
  }

  private updateMemoryStats(agentId: string, memoryType: string, operation: string): void {
    const stats = this.memoryStats.get(agentId) || {};
    const key = `${memoryType}_${operation}`;
    stats[key] = (stats[key] || 0) + 1;
    stats.lastActivity = new Date();
    this.memoryStats.set(agentId, stats);
  }

  private calculateMemoryHealth(agentId: string): number {
    const episodicCount = this.episodicMemory.get(agentId)?.length || 0;
    const semanticCount = this.semanticMemory.get(agentId)?.length || 0;
    
    // Health based on memory diversity and size
    let health = 0.5; // Base health
    
    if (episodicCount > 10) health += 0.2;
    if (semanticCount > 5) health += 0.2;
    if (this.workingMemory.has(agentId)) health += 0.1;
    
    return Math.min(1.0, health);
  }

  private performMemoryMaintenance(): void {
    try {
      // Clean up old working contexts
      const now = Date.now();
      const maxAge = 60 * 60 * 1000; // 1 hour

      for (const [agentId, context] of this.workingMemory.entries()) {
        if (now - context.lastUpdated.getTime() > maxAge) {
          this.workingMemory.delete(agentId);
          logger.debug(`Cleaned up stale working context for agent ${agentId}`);
        }
      }

      // Consolidate old episodic memories
      for (const [agentId] of this.episodicMemory.entries()) {
        this.consolidateMemories(agentId).catch(error => {
          logger.error(`Failed to consolidate memories for agent ${agentId}:`, error);
        });
      }

    } catch (error) {
      logger.error('Memory maintenance failed:', error);
    }
  }
}

export const agentMemorySystem = AgentMemorySystem.getInstance();
export default agentMemorySystem;
