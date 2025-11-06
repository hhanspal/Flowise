import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { getBaseClasses } from '../../../src/utils'
import { ConsoleCallbackHandler, additionalCallbacks } from '../../../src/handler'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class CustomerSupportAgent_Agents implements INode {
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
        this.label = 'Customer Support Agent'
        this.name = 'customerSupportAgent'
        this.version = 1.0
        this.type = 'CustomerSupportAgent'
        this.category = 'Agents'
        this.icon = 'agent.svg'
        this.description = 'Autonomous customer support agent for handling inquiries, complaints, and support tickets using AgentFlowOS framework'
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Customer Inquiry',
                name: 'inquiry',
                type: 'string',
                description: 'The customer inquiry, complaint, or support request'
            },
            {
                label: 'Chat Model',
                name: 'model',
                type: 'BaseChatModel',
                description: 'LLM model to use for customer support responses'
            },
            {
                label: 'Customer Context',
                name: 'customerContext',
                type: 'string',
                description: 'Additional customer information (account history, previous interactions, etc.)',
                optional: true
            },
            {
                label: 'Support Policies',
                name: 'policies',
                type: 'string',
                description: 'Company support policies and guidelines',
                optional: true
            },
            {
                label: 'Available Actions',
                name: 'availableActions',
                type: 'string',
                description: 'Comma-separated list of available support actions (refund, escalate, create_ticket, etc.)',
                optional: true
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const inquiry = nodeData.inputs?.inquiry as string
        const model = nodeData.inputs?.model as BaseChatModel
        const customerContext = nodeData.inputs?.customerContext as string
        const policies = nodeData.inputs?.policies as string
        const availableActions = nodeData.inputs?.availableActions as string

        if (!inquiry) {
            throw new Error('Customer inquiry is required')
        }
        if (!model) {
            throw new Error('Chat Model is required')
        }

        return { inquiry, model, customerContext, policies, availableActions }
    }

    async run(nodeData: INodeData, input: string, options: ICommonObject): Promise<string | object> {
        const { inquiry, model, customerContext, policies, availableActions } = await this.init(nodeData)

        const loggerHandler = new ConsoleCallbackHandler(options.logger, options?.orgId)
        const callbacks = await additionalCallbacks(nodeData, options)

        try {
            // Generate customer support response
            const response = await this.handleCustomerInquiry(
                inquiry,
                model,
                customerContext || '',
                policies || '',
                availableActions || '',
                callbacks
            )

            return {
                response: response.message,
                sentiment: response.sentiment,
                urgency: response.urgency,
                recommendedAction: response.recommendedAction,
                confidence: response.confidence
            }
        } catch (error) {
            throw new Error(`Customer support failed: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    private async handleCustomerInquiry(
        inquiry: string,
        model: BaseChatModel,
        customerContext: string,
        policies: string,
        availableActions: string,
        callbacks: any[]
    ): Promise<any> {
        const prompt = this.buildSupportPrompt(inquiry, customerContext, policies, availableActions)

        const response = await model.invoke([{
            role: 'user',
            content: prompt
        }], { callbacks })

        const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content)

        try {
            const parsed = JSON.parse(content)
            return this.validateSupportResponse(parsed)
        } catch (error) {
            // Fallback: try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                return this.validateSupportResponse(JSON.parse(jsonMatch[0]))
            }
            throw new Error('Failed to parse support response as JSON')
        }
    }

    private buildSupportPrompt(inquiry: string, customerContext: string, policies: string, availableActions: string): string {
        const actions = availableActions ? availableActions.split(',').map(a => a.trim()) : ['respond', 'escalate', 'create_ticket']

        return `
You are an expert customer support agent. Analyze the following customer inquiry and provide an appropriate response.

Customer Inquiry: ${inquiry}

${customerContext ? `Customer Context: ${customerContext}` : ''}

${policies ? `Support Policies: ${policies}` : ''}

Available Actions: ${actions.join(', ')}

Please provide a JSON response with the following structure:
{
  "message": "Your professional response to the customer",
  "sentiment": "positive|neutral|negative|frustrated",
  "urgency": "low|medium|high|critical",
  "recommendedAction": "respond|escalate|create_ticket|refund|other",
  "confidence": 0.0-1.0,
  "keyIssues": ["issue1", "issue2"],
  "nextSteps": ["step1", "step2"],
  "followUpRequired": true|false,
  "escalationReason": "reason or null"
}

Guidelines:
1. Always respond professionally and empathetically
2. Acknowledge the customer's feelings and concerns
3. Provide clear, actionable solutions when possible
4. Escalate appropriately for complex issues
5. Follow company policies strictly
6. Use the customer's name if available in context
7. Suggest next steps clearly
8. Maintain a helpful and positive tone
`
    }

    private validateSupportResponse(parsed: any): any {
        if (!parsed.message || typeof parsed.message !== 'string') {
            throw new Error('Invalid support response: missing or invalid message')
        }

        if (!parsed.sentiment || !['positive', 'neutral', 'negative', 'frustrated'].includes(parsed.sentiment)) {
            throw new Error('Invalid support response: missing or invalid sentiment')
        }

        if (!parsed.urgency || !['low', 'medium', 'high', 'critical'].includes(parsed.urgency)) {
            throw new Error('Invalid support response: missing or invalid urgency')
        }

        if (!parsed.recommendedAction || typeof parsed.recommendedAction !== 'string') {
            throw new Error('Invalid support response: missing or invalid recommendedAction')
        }

        if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
            throw new Error('Invalid support response: missing or invalid confidence')
        }

        return parsed
    }
}

module.exports = { nodeClass: CustomerSupportAgent_Agents }