/**
 * Agent Planning Engine
 * 
 * Implements autonomous goal decomposition, execution planning, and self-reflection
 * capabilities for agentic workflows.
 */

import { v4 as uuidv4 } from 'uuid';
import { flowiseModelRouter } from './model-router';
// Stub interfaces for Flowise integration
interface AgentContext {
  agentId?: string;
  workflowId?: string;
  availableCapabilities?: string[];
  organizationId?: number;
}

interface ModelRouter {
  routeRequest(request: any): Promise<any>;
  executeWithModel(model: any, prompt: string, options: any): Promise<any>;
}

class StubSchemaGuard {
  static getInstance(): StubSchemaGuard {
    return new StubSchemaGuard();
  }
}

import logger from '../../utils/logger';

export interface Task {
  id: string;
  name: string;
  description: string;
  type: 'atomic' | 'composite';
  estimatedDuration: number;
  requiredCapabilities: string[];
  dependencies: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  successCriteria: string[];
}

export interface SubGoal {
  id: string;
  description: string;
  tasks: Task[];
  dependencies: string[];
  estimatedDuration: number;
  successCriteria: string[];
}

export interface TaskDependency {
  taskId: string;
  dependsOn: string[];
  dependencyType: 'sequential' | 'parallel' | 'conditional';
}

export interface TaskPlan {
  goalId: string;
  mainGoal: string;
  subGoals: SubGoal[];
  dependencies: TaskDependency[];
  estimatedDuration: number;
  requiredCapabilities: string[];
  successCriteria: string[];
  createdAt: Date;
  version: number;
}

export interface PlanningConstraints {
  maxDuration?: number;
  maxCost?: number;
  requiredCapabilities?: string[];
  excludedCapabilities?: string[];
  parallelismLevel?: number;
  priorityThreshold?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ExecutionPlan {
  id: string;
  taskPlan: TaskPlan;
  executionOrder: string[];
  parallelGroups: string[][];
  resourceAllocation: Record<string, any>;
  checkpoints: ExecutionCheckpoint[];
  fallbackStrategies: FallbackStrategy[];
  estimatedCost: number;
  estimatedDuration: number;
}

export interface ExecutionCheckpoint {
  id: string;
  taskId: string;
  condition: string;
  action: 'continue' | 'pause' | 'replan' | 'escalate';
}

export interface FallbackStrategy {
  triggerId: string;
  condition: string;
  action: 'retry' | 'alternative_approach' | 'human_intervention' | 'abort';
  parameters: Record<string, any>;
}

export interface ExecutionFeedback {
  taskId: string;
  status: 'completed' | 'failed' | 'blocked' | 'in_progress';
  actualDuration: number;
  actualCost: number;
  quality: number;
  issues: string[];
  suggestions: string[];
}

export interface ExecutionResults {
  planId: string;
  overallStatus: 'completed' | 'failed' | 'partial';
  completedTasks: string[];
  failedTasks: string[];
  totalDuration: number;
  totalCost: number;
  qualityScore: number;
  lessons: string[];
}

export interface PerformanceInsights {
  planId: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  optimizationOpportunities: string[];
  confidenceScore: number;
}

export class AgentPlanningEngine {
  private static instance: AgentPlanningEngine;
  private modelRouter: ModelRouter;
  private schemaGuard: StubSchemaGuard;
  private planningHistory: Map<string, TaskPlan[]> = new Map();
  private executionHistory: Map<string, ExecutionResults[]> = new Map();

  private constructor() {
    this.modelRouter = flowiseModelRouter;
    this.schemaGuard = StubSchemaGuard.getInstance();
  }

  public static getInstance(): AgentPlanningEngine {
    if (!AgentPlanningEngine.instance) {
      AgentPlanningEngine.instance = new AgentPlanningEngine();
    }
    return AgentPlanningEngine.instance;
  }

  /**
   * Decompose a high-level goal into actionable tasks
   */
  async decomposeGoal(goal: string, context: AgentContext): Promise<TaskPlan> {
    try {
      logger.info(`Decomposing goal: ${goal}`);

      // Use SLM-first approach for goal decomposition
      const decompositionPrompt = this.buildDecompositionPrompt(goal, context);
      
      const routingDecision = await this.modelRouter.routeRequest({
        task: decompositionPrompt,
        context,
        organizationId: context.organizationId || 1,
        priority: 'medium'
      });

      // Generate task decomposition
      const response = await this.modelRouter.executeWithModel(
        routingDecision.selectedModel,
        decompositionPrompt,
        {
          temperature: 0.3,
          maxTokens: 2000,
          format: 'json'
        }
      );

      // Validate and parse response
      const decomposition = await this.validateDecomposition(response.content);
      
      // Create structured task plan
      const taskPlan: TaskPlan = {
        goalId: uuidv4(),
        mainGoal: goal,
        subGoals: decomposition.subGoals,
        dependencies: decomposition.dependencies,
        estimatedDuration: decomposition.estimatedDuration,
        requiredCapabilities: decomposition.requiredCapabilities,
        successCriteria: decomposition.successCriteria,
        createdAt: new Date(),
        version: 1
      };

      // Store in planning history
      const agentHistory = this.planningHistory.get(context.agentId || 'default') || [];
      agentHistory.push(taskPlan);
      this.planningHistory.set(context.agentId || 'default', agentHistory);

      logger.info(`Goal decomposed into ${taskPlan.subGoals.length} sub-goals`);
      return taskPlan;

    } catch (error) {
      logger.error('Goal decomposition failed:', error);
      throw new Error(`Failed to decompose goal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create an execution plan from tasks
   */
  createExecutionPlan(tasks: Task[], constraints: PlanningConstraints = {}): ExecutionPlan {
    try {
      logger.info(`Creating execution plan for ${tasks.length} tasks`);

      // Analyze task dependencies
      const dependencyGraph = this.buildDependencyGraph(tasks);
      
      // Determine execution order
      const executionOrder = this.calculateExecutionOrder(dependencyGraph, constraints);
      
      // Identify parallel execution opportunities
      const parallelGroups = this.identifyParallelGroups(tasks, dependencyGraph);
      
      // Allocate resources
      const resourceAllocation = this.allocateResources(tasks, constraints);
      
      // Create checkpoints
      const checkpoints = this.createCheckpoints(tasks, executionOrder);
      
      // Define fallback strategies
      const fallbackStrategies = this.defineFallbackStrategies(tasks);
      
      // Calculate estimates
      const estimates = this.calculateEstimates(tasks, parallelGroups);

      const executionPlan: ExecutionPlan = {
        id: uuidv4(),
        taskPlan: {
          goalId: uuidv4(),
          mainGoal: 'Generated from tasks',
          subGoals: [],
          dependencies: [],
          estimatedDuration: estimates.duration,
          requiredCapabilities: [...new Set(tasks.flatMap(t => t.requiredCapabilities))],
          successCriteria: [...new Set(tasks.flatMap(t => t.successCriteria))],
          createdAt: new Date(),
          version: 1
        },
        executionOrder,
        parallelGroups,
        resourceAllocation,
        checkpoints,
        fallbackStrategies,
        estimatedCost: estimates.cost,
        estimatedDuration: estimates.duration
      };

      logger.info(`Execution plan created with ${executionOrder.length} steps`);
      return executionPlan;

    } catch (error) {
      logger.error('Execution plan creation failed:', error);
      throw new Error(`Failed to create execution plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Adapt an existing plan based on execution feedback
   */
  adaptPlan(currentPlan: ExecutionPlan, feedback: ExecutionFeedback): ExecutionPlan {
    try {
      logger.info(`Adapting plan ${currentPlan.id} based on feedback for task ${feedback.taskId}`);

      // Analyze feedback impact
      const impact = this.analyzeFeedbackImpact(currentPlan, feedback);
      
      // Determine adaptation strategy
      const adaptationStrategy = this.determineAdaptationStrategy(impact, feedback);
      
      // Apply adaptations
      const adaptedPlan = this.applyAdaptations(currentPlan, adaptationStrategy, feedback);
      
      // Recalculate estimates
      const newEstimates = this.recalculateEstimates(adaptedPlan, feedback);
      
      adaptedPlan.estimatedCost = newEstimates.cost;
      adaptedPlan.estimatedDuration = newEstimates.duration;
      adaptedPlan.id = uuidv4(); // New plan version

      logger.info(`Plan adapted with strategy: ${adaptationStrategy.type}`);
      return adaptedPlan;

    } catch (error) {
      logger.error('Plan adaptation failed:', error);
      throw new Error(`Failed to adapt plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reflect on execution results and generate insights
   */
  reflectOnPerformance(results: ExecutionResults): PerformanceInsights {
    try {
      logger.info(`Reflecting on performance for plan ${results.planId}`);

      // Analyze performance metrics
      const performanceAnalysis = this.analyzePerformance(results);
      
      // Identify patterns from history
      const patterns = this.identifyPerformancePatterns(results);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(performanceAnalysis, patterns);
      
      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(performanceAnalysis, patterns);

      const insights: PerformanceInsights = {
        planId: results.planId,
        strengths: performanceAnalysis.strengths,
        weaknesses: performanceAnalysis.weaknesses,
        recommendations: recommendations,
        optimizationOpportunities: performanceAnalysis.optimizations,
        confidenceScore
      };

      // Store insights for future learning
      this.storePerformanceInsights(results.planId, insights);

      logger.info(`Performance reflection completed with confidence: ${confidenceScore}`);
      return insights;

    } catch (error) {
      logger.error('Performance reflection failed:', error);
      throw new Error(`Failed to reflect on performance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get planning statistics for an agent
   */
  getPlanningStats(agentId: string): any {
    const plans = this.planningHistory.get(agentId) || [];
    const executions = this.executionHistory.get(agentId) || [];

    return {
      totalPlans: plans.length,
      totalExecutions: executions.length,
      averagePlanComplexity: plans.length > 0 ? 
        plans.reduce((sum, plan) => sum + plan.subGoals.length, 0) / plans.length : 0,
      successRate: executions.length > 0 ?
        executions.filter(e => e.overallStatus === 'completed').length / executions.length : 0,
      averageExecutionTime: executions.length > 0 ?
        executions.reduce((sum, e) => sum + e.totalDuration, 0) / executions.length : 0,
      averageQualityScore: executions.length > 0 ?
        executions.reduce((sum, e) => sum + e.qualityScore, 0) / executions.length : 0
    };
  }

  // Private helper methods

  private buildDecompositionPrompt(goal: string, context: AgentContext): string {
    return `
You are an expert AI planning agent. Decompose the following goal into a structured plan.

Goal: ${goal}

Context:
- Agent ID: ${context.agentId}
- Workflow ID: ${context.workflowId}
- Available capabilities: ${context.availableCapabilities?.join(', ') || 'Not specified'}

Please provide a JSON response with the following structure:
{
  "subGoals": [
    {
      "id": "unique_id",
      "description": "Sub-goal description",
      "tasks": [
        {
          "id": "task_id",
          "name": "Task name",
          "description": "Detailed task description",
          "type": "atomic|composite",
          "estimatedDuration": minutes,
          "requiredCapabilities": ["capability1", "capability2"],
          "dependencies": ["task_id1", "task_id2"],
          "priority": "low|medium|high|critical",
          "successCriteria": ["criteria1", "criteria2"]
        }
      ],
      "dependencies": ["subgoal_id1"],
      "estimatedDuration": minutes,
      "successCriteria": ["criteria1", "criteria2"]
    }
  ],
  "dependencies": [
    {
      "taskId": "task_id",
      "dependsOn": ["task_id1", "task_id2"],
      "dependencyType": "sequential|parallel|conditional"
    }
  ],
  "estimatedDuration": total_minutes,
  "requiredCapabilities": ["capability1", "capability2"],
  "successCriteria": ["overall_criteria1", "overall_criteria2"]
}

Focus on:
1. Breaking down complex goals into manageable sub-goals
2. Identifying atomic tasks that can be executed independently
3. Defining clear dependencies between tasks
4. Estimating realistic durations
5. Specifying required capabilities for each task
6. Defining measurable success criteria
`;
  }

  private async validateDecomposition(content: string): Promise<any> {
    try {
      const parsed = JSON.parse(content);
      
      // Basic validation
      if (!parsed.subGoals || !Array.isArray(parsed.subGoals)) {
        throw new Error('Invalid decomposition: missing or invalid subGoals');
      }

      if (!parsed.estimatedDuration || typeof parsed.estimatedDuration !== 'number') {
        throw new Error('Invalid decomposition: missing or invalid estimatedDuration');
      }

      // Validate each sub-goal
      for (const subGoal of parsed.subGoals) {
        if (!subGoal.id || !subGoal.description || !subGoal.tasks) {
          throw new Error(`Invalid sub-goal: ${JSON.stringify(subGoal)}`);
        }

        // Validate tasks
        for (const task of subGoal.tasks) {
          if (!task.id || !task.name || !task.type) {
            throw new Error(`Invalid task: ${JSON.stringify(task)}`);
          }
        }
      }

      return parsed;
    } catch (error) {
      logger.error('Decomposition validation failed:', error);
      throw new Error(`Invalid decomposition format: ${error instanceof Error ? error.message : 'Parse error'}`);
    }
  }

  private buildDependencyGraph(tasks: Task[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const task of tasks) {
      graph.set(task.id, task.dependencies || []);
    }
    
    return graph;
  }

  private calculateExecutionOrder(
    dependencyGraph: Map<string, string[]>,
    constraints: PlanningConstraints
  ): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (taskId: string) => {
      if (visiting.has(taskId)) {
        throw new Error(`Circular dependency detected involving task: ${taskId}`);
      }
      
      if (visited.has(taskId)) {
        return;
      }

      visiting.add(taskId);
      
      const dependencies = dependencyGraph.get(taskId) || [];
      for (const dep of dependencies) {
        visit(dep);
      }
      
      visiting.delete(taskId);
      visited.add(taskId);
      order.push(taskId);
    };

    for (const taskId of dependencyGraph.keys()) {
      if (!visited.has(taskId)) {
        visit(taskId);
      }
    }

    return order;
  }

  private identifyParallelGroups(tasks: Task[], dependencyGraph: Map<string, string[]>): string[][] {
    const groups: string[][] = [];
    const processed = new Set<string>();

    for (const task of tasks) {
      if (processed.has(task.id)) continue;

      const group: string[] = [task.id];
      processed.add(task.id);

      // Find tasks that can run in parallel (no dependencies between them)
      for (const otherTask of tasks) {
        if (processed.has(otherTask.id)) continue;

        const canRunInParallel = this.canRunInParallel(
          task.id, 
          otherTask.id, 
          dependencyGraph
        );

        if (canRunInParallel) {
          group.push(otherTask.id);
          processed.add(otherTask.id);
        }
      }

      if (group.length > 1) {
        groups.push(group);
      }
    }

    return groups;
  }

  private canRunInParallel(
    taskId1: string, 
    taskId2: string, 
    dependencyGraph: Map<string, string[]>
  ): boolean {
    const deps1 = dependencyGraph.get(taskId1) || [];
    const deps2 = dependencyGraph.get(taskId2) || [];

    // Tasks can run in parallel if neither depends on the other
    return !deps1.includes(taskId2) && !deps2.includes(taskId1);
  }

  private allocateResources(tasks: Task[], constraints: PlanningConstraints): Record<string, any> {
    const allocation: Record<string, any> = {};

    for (const task of tasks) {
      allocation[task.id] = {
        requiredCapabilities: task.requiredCapabilities,
        estimatedDuration: task.estimatedDuration,
        priority: task.priority,
        resourceType: task.type === 'atomic' ? 'single_agent' : 'multi_agent'
      };
    }

    return allocation;
  }

  private createCheckpoints(tasks: Task[], executionOrder: string[]): ExecutionCheckpoint[] {
    const checkpoints: ExecutionCheckpoint[] = [];

    // Create checkpoints at critical points
    const criticalTasks = tasks.filter(t => t.priority === 'critical');
    const midpoint = Math.floor(executionOrder.length / 2);

    for (const task of criticalTasks) {
      checkpoints.push({
        id: uuidv4(),
        taskId: task.id,
        condition: 'task_completion',
        action: 'pause'
      });
    }

    // Add midpoint checkpoint
    if (executionOrder.length > 2) {
      checkpoints.push({
        id: uuidv4(),
        taskId: executionOrder[midpoint],
        condition: 'progress_review',
        action: 'continue'
      });
    }

    return checkpoints;
  }

  private defineFallbackStrategies(tasks: Task[]): FallbackStrategy[] {
    const strategies: FallbackStrategy[] = [];

    for (const task of tasks) {
      if (task.priority === 'critical') {
        strategies.push({
          triggerId: task.id,
          condition: 'task_failure',
          action: 'human_intervention',
          parameters: { escalationLevel: 'immediate' }
        });
      } else {
        strategies.push({
          triggerId: task.id,
          condition: 'task_failure',
          action: 'retry',
          parameters: { maxRetries: 3, backoffMs: 5000 }
        });
      }
    }

    return strategies;
  }

  private calculateEstimates(tasks: Task[], parallelGroups: string[][]): { duration: number; cost: number } {
    let totalDuration = 0;
    let totalCost = 0;

    // Calculate sequential duration
    const sequentialTasks = tasks.filter(t => 
      !parallelGroups.some(group => group.includes(t.id))
    );

    totalDuration += sequentialTasks.reduce((sum, task) => sum + task.estimatedDuration, 0);

    // Calculate parallel group durations (max duration in each group)
    for (const group of parallelGroups) {
      const groupTasks = tasks.filter(t => group.includes(t.id));
      const maxDuration = Math.max(...groupTasks.map(t => t.estimatedDuration));
      totalDuration += maxDuration;
    }

    // Estimate cost (simplified)
    totalCost = tasks.length * 0.05; // $0.05 per task

    return { duration: totalDuration, cost: totalCost };
  }

  private analyzeFeedbackImpact(plan: ExecutionPlan, feedback: ExecutionFeedback): any {
    return {
      severity: feedback.status === 'failed' ? 'high' : 'medium',
      affectedTasks: this.findAffectedTasks(plan, feedback.taskId),
      timelineImpact: feedback.actualDuration - (plan.estimatedDuration / plan.executionOrder.length),
      costImpact: feedback.actualCost - (plan.estimatedCost / plan.executionOrder.length)
    };
  }

  private findAffectedTasks(plan: ExecutionPlan, failedTaskId: string): string[] {
    // Find tasks that depend on the failed task
    return plan.executionOrder.filter(taskId => {
      // This is simplified - in reality, we'd check the dependency graph
      return plan.executionOrder.indexOf(taskId) > plan.executionOrder.indexOf(failedTaskId);
    });
  }

  private determineAdaptationStrategy(impact: any, feedback: ExecutionFeedback): any {
    if (feedback.status === 'failed' && impact.severity === 'high') {
      return { type: 'replan', scope: 'full' };
    } else if (feedback.status === 'blocked') {
      return { type: 'reorder', scope: 'partial' };
    } else {
      return { type: 'adjust_estimates', scope: 'minimal' };
    }
  }

  private applyAdaptations(
    plan: ExecutionPlan, 
    strategy: any, 
    feedback: ExecutionFeedback
  ): ExecutionPlan {
    const adaptedPlan = { ...plan };

    switch (strategy.type) {
      case 'replan':
        // Regenerate execution order excluding failed task
        adaptedPlan.executionOrder = plan.executionOrder.filter(id => id !== feedback.taskId);
        break;
      case 'reorder':
        // Move blocked task to end
        const taskIndex = adaptedPlan.executionOrder.indexOf(feedback.taskId);
        if (taskIndex > -1) {
          adaptedPlan.executionOrder.splice(taskIndex, 1);
          adaptedPlan.executionOrder.push(feedback.taskId);
        }
        break;
      case 'adjust_estimates':
        // Update duration estimates based on actual performance
        adaptedPlan.estimatedDuration *= (feedback.actualDuration / (plan.estimatedDuration / plan.executionOrder.length));
        break;
    }

    return adaptedPlan;
  }

  private recalculateEstimates(plan: ExecutionPlan, feedback: ExecutionFeedback): { duration: number; cost: number } {
    // Simplified recalculation
    const adjustmentFactor = feedback.actualDuration / (plan.estimatedDuration / plan.executionOrder.length);
    
    return {
      duration: plan.estimatedDuration * adjustmentFactor,
      cost: plan.estimatedCost * adjustmentFactor
    };
  }

  private analyzePerformance(results: ExecutionResults): any {
    const successRate = results.completedTasks.length / (results.completedTasks.length + results.failedTasks.length);
    
    return {
      strengths: successRate > 0.8 ? ['High success rate', 'Good task completion'] : [],
      weaknesses: successRate < 0.6 ? ['Low success rate', 'Task execution issues'] : [],
      optimizations: results.qualityScore < 0.7 ? ['Improve task quality', 'Better resource allocation'] : []
    };
  }

  private identifyPerformancePatterns(results: ExecutionResults): string[] {
    // Simplified pattern identification
    const patterns: string[] = [];
    
    if (results.totalDuration > results.completedTasks.length * 60) {
      patterns.push('Tasks taking longer than expected');
    }
    
    if (results.failedTasks.length > 0) {
      patterns.push('Task failure pattern detected');
    }
    
    return patterns;
  }

  private generateRecommendations(analysis: any, patterns: string[]): string[] {
    const recommendations: string[] = [];
    
    if (analysis.weaknesses.includes('Low success rate')) {
      recommendations.push('Review task complexity and break down further');
    }
    
    if (patterns.includes('Tasks taking longer than expected')) {
      recommendations.push('Adjust duration estimates and add buffer time');
    }
    
    return recommendations;
  }

  private calculateConfidenceScore(analysis: any, patterns: string[]): number {
    let score = 0.8; // Base confidence
    
    if (analysis.strengths.length > analysis.weaknesses.length) {
      score += 0.1;
    } else {
      score -= 0.1;
    }
    
    if (patterns.length > 2) {
      score -= 0.2;
    }
    
    return Math.max(0.1, Math.min(1.0, score));
  }

  private storePerformanceInsights(planId: string, insights: PerformanceInsights): void {
    // Store insights for future learning - this would integrate with the memory system
    logger.debug(`Stored performance insights for plan ${planId}`);
  }
}

export const agentPlanningEngine = AgentPlanningEngine.getInstance();
export default agentPlanningEngine;
