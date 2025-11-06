import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'

class DecisionAgent_Agents implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    baseClasses: string[]
    inputs: INodeParams[]

    constructor() {
        this.label = 'Decision Agent'
        this.name = 'decisionAgent'
        this.version = 1.0
        this.type = 'DecisionAgent'
        this.category = 'Agents'
        this.icon = 'decision.svg'
        this.description = 'Autonomous decision-making agent that analyzes context and makes workflow decisions based on predefined criteria'
        this.baseClasses = [this.type, 'BaseChatModel', 'Tool']
        this.inputs = [
            {
                label: 'Chat Model',
                name: 'model',
                type: 'BaseChatModel'
            },
            {
                label: 'Decision Criteria',
                name: 'decisionCriteria',
                type: 'string',
                description: 'JSON array of decision criteria with conditions and actions',
                default: '[{"condition": "input.value > 100", "action": "escalate", "reason": "High value transaction"}, {"condition": "input.urgency === \\"high\\"", "action": "prioritize", "reason": "Urgent request"}]'
            },
            {
                label: 'Decision Threshold',
                name: 'decisionThreshold',
                type: 'number',
                description: 'Confidence threshold for autonomous decisions (0-1)',
                default: 0.8
            },
            {
                label: 'Require Human Approval',
                name: 'requireApproval',
                type: 'boolean',
                description: 'Require human approval for high-impact decisions',
                default: false
            },
            {
                label: 'Context Analysis',
                name: 'contextAnalysis',
                type: 'boolean',
                description: 'Analyze workflow context and previous results',
                default: true
            },
            {
                label: 'Decision Memory',
                name: 'decisionMemory',
                type: 'boolean',
                description: 'Remember previous decisions for consistency',
                default: true
            },
            {
                label: 'Fallback Action',
                name: 'fallbackAction',
                type: 'options',
                options: [
                    { label: 'Escalate to Human', name: 'escalate' },
                    { label: 'Use Default Path', name: 'default' },
                    { label: 'Stop Workflow', name: 'stop' },
                    { label: 'Retry Decision', name: 'retry' }
                ],
                default: 'escalate'
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const model = nodeData.inputs?.model as BaseChatModel
        const decisionCriteria = nodeData.inputs?.decisionCriteria as string
        const decisionThreshold = nodeData.inputs?.decisionThreshold as number
        const requireApproval = nodeData.inputs?.requireApproval as boolean
        const contextAnalysis = nodeData.inputs?.contextAnalysis as boolean
        const decisionMemory = nodeData.inputs?.decisionMemory as boolean
        const fallbackAction = nodeData.inputs?.fallbackAction as string

        if (!model) {
            throw new Error('Chat Model is required')
        }

        let criteria = []
        try {
            criteria = JSON.parse(decisionCriteria || '[]')
        } catch (error) {
            throw new Error('Invalid decision criteria JSON')
        }

        return {
            model,
            decisionCriteria: criteria,
            decisionThreshold: decisionThreshold || 0.8,
            requireApproval: requireApproval || false,
            contextAnalysis: contextAnalysis !== false,
            decisionMemory: decisionMemory !== false,
            fallbackAction: fallbackAction || 'escalate'
        }
    }

    async run(nodeData: INodeData): Promise<string | object> {
        const config = await this.init(nodeData)

        const tools = await this.createDecisionTools(config)
        return tools
    }

    private async createDecisionTools(config: any): Promise<any[]> {
        const tools = []

        // Decision evaluation tool
        tools.push({
            name: 'evaluate_decision',
            description: 'Evaluate decision criteria against input data and determine appropriate action',
            schema: {
                type: 'object',
                properties: {
                    inputData: {
                        type: 'object',
                        description: 'Input data to evaluate against decision criteria'
                    },
                    contextData: {
                        type: 'object',
                        description: 'Additional context from workflow execution'
                    },
                    workflowHistory: {
                        type: 'array',
                        description: 'Previous workflow execution results'
                    }
                },
                required: ['inputData']
            },
            func: async (params: any) => {
                return this.evaluateDecision(params, config)
            }
        })

        // Criteria management tool
        tools.push({
            name: 'manage_criteria',
            description: 'Add, update, or remove decision criteria',
            schema: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        enum: ['add', 'update', 'remove', 'list'],
                        description: 'Action to perform on criteria'
                    },
                    criteria: {
                        type: 'object',
                        description: 'Criteria object for add/update operations'
                    },
                    criteriaId: {
                        type: 'string',
                        description: 'Criteria ID for update/remove operations'
                    }
                },
                required: ['action']
            },
            func: async (params: any) => {
                return this.manageCriteria(params, config)
            }
        })

        // Decision confidence analysis tool
        tools.push({
            name: 'analyze_confidence',
            description: 'Analyze decision confidence and determine if human approval is needed',
            schema: {
                type: 'object',
                properties: {
                    decision: {
                        type: 'object',
                        description: 'Decision object with confidence score'
                    },
                    threshold: {
                        type: 'number',
                        description: 'Confidence threshold override'
                    }
                },
                required: ['decision']
            },
            func: async (params: any) => {
                return this.analyzeConfidence(params, config)
            }
        })

        return tools
    }

    private async evaluateDecision(params: any, config: any): Promise<any> {
        const { inputData, contextData, workflowHistory } = params
        const { model, decisionCriteria, decisionThreshold, contextAnalysis, decisionMemory } = config

        try {
            // Analyze context if enabled
            let contextAnalysisResult = null
            if (contextAnalysis && (contextData || workflowHistory)) {
                contextAnalysisResult = await this.analyzeContext(inputData, contextData, workflowHistory, model)
            }

            // Evaluate each decision criterion
            const evaluations = []
            for (const criterion of decisionCriteria) {
                try {
                    const result = await this.evaluateCriterion(criterion, inputData, contextAnalysisResult, model)
                    evaluations.push(result)
                } catch (error) {
                    console.warn(`Failed to evaluate criterion ${criterion.condition}:`, error)
                }
            }

            // Find the best matching decision
            const bestDecision = this.selectBestDecision(evaluations, decisionThreshold)

            // Check if human approval is needed
            const needsApproval = this.checkApprovalRequired(bestDecision, config)

            // Apply decision memory if enabled
            if (decisionMemory && bestDecision) {
                await this.recordDecision(bestDecision, inputData)
            }

            return {
                success: true,
                decision: bestDecision,
                evaluations,
                contextAnalysis: contextAnalysisResult,
                needsApproval,
                confidence: bestDecision?.confidence || 0,
                reasoning: bestDecision?.reasoning || 'No decision criteria matched'
            }

        } catch (error) {
            // Fallback action
            return this.executeFallback(config.fallbackAction, error, inputData)
        }
    }

    private async analyzeContext(inputData: any, contextData: any, workflowHistory: any[], model: BaseChatModel): Promise<any> {
        const contextPrompt = `Analyze the following workflow context and input data to provide insights for decision making:

Input Data: ${JSON.stringify(inputData, null, 2)}
Context Data: ${JSON.stringify(contextData || {}, null, 2)}
Workflow History: ${JSON.stringify(workflowHistory || [], null, 2)}

Provide a brief analysis of patterns, trends, and relevant factors for decision making.`

        const response = await model.invoke([{
            role: 'user',
            content: contextPrompt
        }])

        return {
            analysis: response.content,
            timestamp: new Date().toISOString(),
            factors: this.extractDecisionFactors(response.content as string)
        }
    }

    private async evaluateCriterion(criterion: any, inputData: any, contextAnalysis: any, model: BaseChatModel): Promise<any> {
        // Simple condition evaluation (in production, this would be more sophisticated)
        const condition = criterion.condition
        const action = criterion.action
        const reason = criterion.reason

        // For now, use LLM to evaluate complex conditions
        // In production, you'd have a proper expression evaluator
        const evaluationPrompt = `Evaluate if the following condition is true based on the input data:

Condition: ${condition}
Input Data: ${JSON.stringify(inputData, null, 2)}
Context: ${contextAnalysis?.analysis || 'No context available'}

Respond with only "true" or "false" followed by a confidence score (0-1).`

        const response = await model.invoke([{
            role: 'user',
            content: evaluationPrompt
        }])

        const responseText = response.content as string
        const isTrue = responseText.toLowerCase().includes('true')
        const confidence = this.extractConfidence(responseText)

        return {
            criterion,
            condition,
            action,
            reason,
            matches: isTrue,
            confidence,
            evaluation: responseText
        }
    }

    private selectBestDecision(evaluations: any[], threshold: number): any {
        // Find evaluations that match their conditions
        const matchingEvaluations = evaluations.filter(e => e.matches && e.confidence >= threshold)

        if (matchingEvaluations.length === 0) {
            return null
        }

        // Select the one with highest confidence
        return matchingEvaluations.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
        )
    }

    private checkApprovalRequired(decision: any, config: any): boolean {
        if (!decision) return true
        if (config.requireApproval) return true

        // Check if decision confidence is below threshold
        if (decision.confidence < config.decisionThreshold) return true

        // Check for high-impact actions that might need approval
        const highImpactActions = ['escalate', 'stop', 'delete', 'approve']
        if (highImpactActions.includes(decision.action)) return true

        return false
    }

    private async recordDecision(decision: any, inputData: any): Promise<void> {
        // In a real implementation, this would store decisions in a database
        // for future reference and consistency checking
        console.log('Recording decision for future reference:', {
            decision: decision.action,
            reason: decision.reason,
            input: inputData,
            timestamp: new Date().toISOString()
        })
    }

    private executeFallback(fallbackAction: string, error: any, inputData: any): any {
        return {
            success: false,
            fallback: true,
            action: fallbackAction,
            error: error.message,
            inputData,
            timestamp: new Date().toISOString()
        }
    }

    private extractDecisionFactors(analysis: string): string[] {
        // Simple extraction - in production, use NLP
        const factors = []
        const keywords = ['trend', 'pattern', 'factor', 'condition', 'context']

        for (const keyword of keywords) {
            if (analysis.toLowerCase().includes(keyword)) {
                factors.push(keyword)
            }
        }

        return factors
    }

    private extractConfidence(text: string): number {
        const match = text.match(/(\d*\.?\d+)/)
        return match ? Math.min(1, Math.max(0, parseFloat(match[1]))) : 0.5
    }

    private async manageCriteria(params: any, config: any): Promise<any> {
        const { action, criteria, criteriaId } = params

        switch (action) {
            case 'add':
                if (!criteria) throw new Error('Criteria object required for add action')
                config.decisionCriteria.push({ ...criteria, id: Date.now().toString() })
                break

            case 'update':
                if (!criteriaId || !criteria) throw new Error('Criteria ID and object required for update')
                const updateIndex = config.decisionCriteria.findIndex((c: any) => c.id === criteriaId)
                if (updateIndex === -1) throw new Error('Criteria not found')
                config.decisionCriteria[updateIndex] = { ...config.decisionCriteria[updateIndex], ...criteria }
                break

            case 'remove':
                if (!criteriaId) throw new Error('Criteria ID required for remove action')
                config.decisionCriteria = config.decisionCriteria.filter((c: any) => c.id !== criteriaId)
                break

            case 'list':
                return { success: true, criteria: config.decisionCriteria }

            default:
                throw new Error(`Unknown action: ${action}`)
        }

        return { success: true, action, criteria: config.decisionCriteria }
    }

    private async analyzeConfidence(params: any, config: any): Promise<any> {
        const { decision, threshold } = params
        const confidenceThreshold = threshold || config.decisionThreshold

        const needsApproval = decision.confidence < confidenceThreshold
        const riskLevel = decision.confidence < 0.5 ? 'high' :
                         decision.confidence < 0.7 ? 'medium' : 'low'

        return {
            success: true,
            confidence: decision.confidence,
            threshold: confidenceThreshold,
            needsApproval,
            riskLevel,
            recommendation: needsApproval ? 'Require human approval' : 'Proceed autonomously'
        }
    }
}

module.exports = { nodeClass: DecisionAgent_Agents }