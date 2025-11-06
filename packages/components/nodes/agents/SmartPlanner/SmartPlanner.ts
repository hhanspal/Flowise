import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { getBaseClasses } from '../../../src/utils'
import { ConsoleCallbackHandler, additionalCallbacks } from '../../../src/handler'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class SmartPlanner_Agents implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]

    constructor() {
        this.label = 'Smart Planner'
        this.name = 'smartPlanner'
        this.version = 1.0
        this.type = 'SmartPlanner'
        this.category = 'Agents'
        this.icon = 'agent.svg'
        this.description = 'Autonomous goal decomposition and planning agent using AgentFlowOS planning engine'
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Goal',
                name: 'goal',
                type: 'string',
                description: 'The high-level goal to decompose into actionable tasks'
            },
            {
                label: 'Chat Model',
                name: 'model',
                type: 'BaseChatModel',
                description: 'LLM model to use for planning'
            },
            {
                label: 'Available Capabilities',
                name: 'capabilities',
                type: 'string',
                description: 'Comma-separated list of available capabilities',
                optional: true
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const goal = nodeData.inputs?.goal as string
        const model = nodeData.inputs?.model as BaseChatModel
        const capabilities = nodeData.inputs?.capabilities as string

        if (!goal) {
            throw new Error('Goal is required')
        }
        if (!model) {
            throw new Error('Chat Model is required')
        }

        return { goal, model, capabilities }
    }

    async run(nodeData: INodeData, input: string, options: ICommonObject): Promise<string | object> {
        const { goal, model, capabilities } = await this.init(nodeData)

        const loggerHandler = new ConsoleCallbackHandler(options.logger, options?.orgId)
        const callbacks = await additionalCallbacks(nodeData, options)

        try {
            // Use the planning engine to decompose the goal
            const plan = await this.decomposeGoal(goal, model, capabilities || '', callbacks)

            return {
                plan: JSON.stringify(plan, null, 2),
                taskCount: plan.subGoals?.reduce((sum, sg) => sum + (sg.tasks?.length || 0), 0) || 0,
                subGoalCount: plan.subGoals?.length || 0
            }
        } catch (error) {
            throw new Error(`Planning failed: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    private async decomposeGoal(goal: string, model: BaseChatModel, capabilities: string, callbacks: any[]): Promise<any> {
        const prompt = this.buildDecompositionPrompt(goal, capabilities)

        const response = await model.invoke([{
            role: 'user',
            content: prompt
        }], { callbacks })

        const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content)

        try {
            const parsed = JSON.parse(content)
            return this.validateDecomposition(parsed)
        } catch (error) {
            // Fallback: try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                return this.validateDecomposition(JSON.parse(jsonMatch[0]))
            }
            throw new Error('Failed to parse planning response as JSON')
        }
    }

    private buildDecompositionPrompt(goal: string, capabilities: string): string {
        return `
You are an expert AI planning agent. Decompose the following goal into a structured plan.

Goal: ${goal}

Available capabilities: ${capabilities || 'Not specified'}

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
`
    }

    private validateDecomposition(parsed: any): any {
        if (!parsed.subGoals || !Array.isArray(parsed.subGoals)) {
            throw new Error('Invalid decomposition: missing or invalid subGoals')
        }

        if (!parsed.estimatedDuration || typeof parsed.estimatedDuration !== 'number') {
            throw new Error('Invalid decomposition: missing or invalid estimatedDuration')
        }

        // Basic validation
        for (const subGoal of parsed.subGoals) {
            if (!subGoal.id || !subGoal.description || !subGoal.tasks) {
                throw new Error(`Invalid sub-goal: ${JSON.stringify(subGoal)}`)
            }

            for (const task of subGoal.tasks) {
                if (!task.id || !task.name || !task.type) {
                    throw new Error(`Invalid task: ${JSON.stringify(task)}`)
                }
            }
        }

        return parsed
    }
}

module.exports = { nodeClass: SmartPlanner_Agents }