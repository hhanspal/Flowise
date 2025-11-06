import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { getBaseClasses } from '../../../src/utils'
import { ConsoleCallbackHandler, additionalCallbacks } from '../../../src/handler'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class SalesAgent_Agents implements INode {
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
        this.label = 'Sales Agent'
        this.name = 'salesAgent'
        this.version = 1.0
        this.type = 'SalesAgent'
        this.category = 'Agents'
        this.icon = 'agent.svg'
        this.description = 'Autonomous sales agent for lead qualification, opportunity management, and deal closing using AgentFlowOS framework'
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Lead Information',
                name: 'leadInfo',
                type: 'string',
                description: 'Lead details including name, company, contact info, and current status'
            },
            {
                label: 'Chat Model',
                name: 'model',
                type: 'BaseChatModel',
                description: 'LLM model to use for sales conversations and analysis'
            },
            {
                label: 'Sales Context',
                name: 'salesContext',
                type: 'string',
                description: 'Additional sales context (product info, pricing, competitor analysis)',
                optional: true
            },
            {
                label: 'Sales Goals',
                name: 'salesGoals',
                type: 'string',
                description: 'Sales objectives and targets for this interaction',
                optional: true
            },
            {
                label: 'Available Actions',
                name: 'availableActions',
                type: 'string',
                description: 'Comma-separated list of available sales actions (schedule_demo, send_proposal, qualify_lead, etc.)',
                optional: true
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const leadInfo = nodeData.inputs?.leadInfo as string
        const model = nodeData.inputs?.model as BaseChatModel
        const salesContext = nodeData.inputs?.salesContext as string
        const salesGoals = nodeData.inputs?.salesGoals as string
        const availableActions = nodeData.inputs?.availableActions as string

        if (!leadInfo) {
            throw new Error('Lead information is required')
        }
        if (!model) {
            throw new Error('Chat Model is required')
        }

        return { leadInfo, model, salesContext, salesGoals, availableActions }
    }

    async run(nodeData: INodeData, input: string, options: ICommonObject): Promise<string | object> {
        const { leadInfo, model, salesContext, salesGoals, availableActions } = await this.init(nodeData)

        const loggerHandler = new ConsoleCallbackHandler(options.logger, options?.orgId)
        const callbacks = await additionalCallbacks(nodeData, options)

        try {
            // Generate sales strategy and next steps
            const salesStrategy = await this.analyzeLeadAndStrategize(
                leadInfo,
                model,
                salesContext || '',
                salesGoals || '',
                availableActions || '',
                callbacks
            )

            return {
                leadAnalysis: salesStrategy.leadAnalysis,
                recommendedAction: salesStrategy.recommendedAction,
                nextSteps: salesStrategy.nextSteps,
                confidence: salesStrategy.confidence,
                urgency: salesStrategy.urgency,
                dealValue: salesStrategy.dealValue
            }
        } catch (error) {
            throw new Error(`Sales analysis failed: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    private async analyzeLeadAndStrategize(
        leadInfo: string,
        model: BaseChatModel,
        salesContext: string,
        salesGoals: string,
        availableActions: string,
        callbacks: any[]
    ): Promise<any> {
        const actions = availableActions ? availableActions.split(',').map(a => a.trim()) : ['qualify_lead', 'schedule_demo', 'send_proposal', 'follow_up']

        const prompt = this.buildSalesPrompt(leadInfo, salesContext, salesGoals, actions)

        const response = await model.invoke([{
            role: 'user',
            content: prompt
        }], { callbacks })

        const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content)

        try {
            const parsed = JSON.parse(content)
            return this.validateSalesStrategy(parsed)
        } catch (error) {
            // Fallback: try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                return this.validateSalesStrategy(JSON.parse(jsonMatch[0]))
            }
            throw new Error('Failed to parse sales strategy as JSON')
        }
    }

    private buildSalesPrompt(leadInfo: string, salesContext: string, salesGoals: string, actions: string[]): string {
        return `
You are an expert sales agent analyzing a lead and determining the best sales strategy.

Lead Information: ${leadInfo}

${salesContext ? `Sales Context: ${salesContext}` : ''}

${salesGoals ? `Sales Goals: ${salesGoals}` : ''}

Available Actions: ${actions.join(', ')}

Please provide a JSON response with the following structure:
{
  "leadAnalysis": "Detailed analysis of the lead's needs, budget, timeline, and buying signals",
  "recommendedAction": "Best immediate action from available actions",
  "nextSteps": ["step1", "step2", "step3"],
  "confidence": 0.0-1.0,
  "urgency": "low|medium|high|critical",
  "dealValue": "estimated|low|medium|high|enterprise",
  "objections": ["potential_objection1", "potential_objection2"],
  "qualificationScore": 0-100,
  "timeline": "immediate|this_quarter|this_year|long_term"
}

Guidelines:
1. Analyze the lead's explicit and implicit needs
2. Assess buying signals and qualification factors
3. Recommend the most appropriate next action
4. Provide specific, actionable next steps
5. Consider the lead's industry, company size, and role
6. Factor in budget indicators and decision-making process
7. Identify potential objections and how to address them
8. Estimate deal value and timeline appropriately
`
    }

    private validateSalesStrategy(parsed: any): any {
        if (!parsed.leadAnalysis || typeof parsed.leadAnalysis !== 'string') {
            throw new Error('Invalid sales strategy: missing or invalid leadAnalysis')
        }

        if (!parsed.recommendedAction || typeof parsed.recommendedAction !== 'string') {
            throw new Error('Invalid sales strategy: missing or invalid recommendedAction')
        }

        if (!parsed.nextSteps || !Array.isArray(parsed.nextSteps)) {
            throw new Error('Invalid sales strategy: missing or invalid nextSteps')
        }

        if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
            throw new Error('Invalid sales strategy: missing or invalid confidence')
        }

        if (!parsed.urgency || !['low', 'medium', 'high', 'critical'].includes(parsed.urgency)) {
            throw new Error('Invalid sales strategy: missing or invalid urgency')
        }

        return parsed
    }
}

module.exports = { nodeClass: SalesAgent_Agents }