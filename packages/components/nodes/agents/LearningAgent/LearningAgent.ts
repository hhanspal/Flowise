import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'

class LearningAgent_Agents implements INode {
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
        this.label = 'Learning Agent'
        this.name = 'learningAgent'
        this.version = 1.0
        this.type = 'LearningAgent'
        this.category = 'Agents'
        this.icon = 'learning.svg'
        this.description = 'Adaptive agent that learns from execution history and continuously improves performance'
        this.baseClasses = [this.type, 'BaseChatModel', 'Tool']
        this.inputs = [
            {
                label: 'Chat Model',
                name: 'model',
                type: 'BaseChatModel'
            },
            {
                label: 'Learning Mode',
                name: 'learningMode',
                type: 'options',
                options: [
                    { label: 'Continuous Learning', name: 'continuous' },
                    { label: 'Batch Learning', name: 'batch' },
                    { label: 'Reinforcement Learning', name: 'reinforcement' },
                    { label: 'Transfer Learning', name: 'transfer' }
                ],
                default: 'continuous'
            },
            {
                label: 'Memory Type',
                name: 'memoryType',
                type: 'options',
                options: [
                    { label: 'Short-term Memory', name: 'short_term' },
                    { label: 'Long-term Memory', name: 'long_term' },
                    { label: 'Episodic Memory', name: 'episodic' },
                    { label: 'Procedural Memory', name: 'procedural' }
                ],
                default: 'episodic'
            },
            {
                label: 'Learning Rate',
                name: 'learningRate',
                type: 'number',
                description: 'How quickly the agent adapts to new information (0.1-1.0)',
                default: 0.5
            },
            {
                label: 'Experience Window',
                name: 'experienceWindow',
                type: 'number',
                description: 'Number of past executions to consider for learning (10-1000)',
                default: 100
            },
            {
                label: 'Performance Threshold',
                name: 'performanceThreshold',
                type: 'number',
                description: 'Minimum performance score to trigger learning updates (0-1)',
                default: 0.7
            },
            {
                label: 'Adaptation Strategy',
                name: 'adaptationStrategy',
                type: 'options',
                options: [
                    { label: 'Conservative', name: 'conservative' },
                    { label: 'Balanced', name: 'balanced' },
                    { label: 'Aggressive', name: 'aggressive' }
                ],
                default: 'balanced'
            },
            {
                label: 'Feedback Source',
                name: 'feedbackSource',
                type: 'options',
                options: [
                    { label: 'Execution Results', name: 'execution' },
                    { label: 'User Feedback', name: 'user' },
                    { label: 'Performance Metrics', name: 'metrics' },
                    { label: 'External Validation', name: 'external' }
                ],
                default: 'execution'
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const model = nodeData.inputs?.model as BaseChatModel
        const learningMode = nodeData.inputs?.learningMode as string
        const memoryType = nodeData.inputs?.memoryType as string
        const learningRate = nodeData.inputs?.learningRate as number
        const experienceWindow = nodeData.inputs?.experienceWindow as number
        const performanceThreshold = nodeData.inputs?.performanceThreshold as number
        const adaptationStrategy = nodeData.inputs?.adaptationStrategy as string
        const feedbackSource = nodeData.inputs?.feedbackSource as string

        if (!model) {
            throw new Error('Chat Model is required')
        }

        return {
            model,
            learningMode: learningMode || 'continuous',
            memoryType: memoryType || 'episodic',
            learningRate: learningRate || 0.5,
            experienceWindow: experienceWindow || 100,
            performanceThreshold: performanceThreshold || 0.7,
            adaptationStrategy: adaptationStrategy || 'balanced',
            feedbackSource: feedbackSource || 'execution'
        }
    }

    async run(nodeData: INodeData): Promise<string | object> {
        const config = await this.init(nodeData)

        const tools = await this.createLearningTools(config)
        return tools
    }

    private async createLearningTools(config: any): Promise<any[]> {
        const tools = []

        // Experience analysis tool
        tools.push({
            name: 'analyze_experience',
            description: 'Analyze past execution experiences to identify patterns and insights',
            schema: {
                type: 'object',
                properties: {
                    experiences: {
                        type: 'array',
                        description: 'Array of past execution experiences'
                    },
                    analysisType: {
                        type: 'string',
                        enum: ['patterns', 'trends', 'anomalies', 'correlations'],
                        description: 'Type of analysis to perform'
                    },
                    timeRange: {
                        type: 'string',
                        description: 'Time range for analysis (e.g., "last_30_days", "all_time")'
                    }
                },
                required: ['experiences']
            },
            func: async (params: any) => {
                return this.analyzeExperience(params, config)
            }
        })

        // Learning adaptation tool
        tools.push({
            name: 'adapt_behavior',
            description: 'Adapt agent behavior based on learned insights and performance feedback',
            schema: {
                type: 'object',
                properties: {
                    insights: {
                        type: 'object',
                        description: 'Learned insights from experience analysis'
                    },
                    currentBehavior: {
                        type: 'object',
                        description: 'Current agent behavior configuration'
                    },
                    performanceMetrics: {
                        type: 'object',
                        description: 'Current performance metrics'
                    },
                    adaptationScope: {
                        type: 'string',
                        enum: ['minor', 'moderate', 'major'],
                        description: 'Scope of behavioral adaptation'
                    }
                },
                required: ['insights']
            },
            func: async (params: any) => {
                return this.adaptBehavior(params, config)
            }
        })

        // Memory management tool
        tools.push({
            name: 'manage_memory',
            description: 'Manage and optimize agent memory for better learning and recall',
            schema: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        enum: ['store', 'retrieve', 'update', 'consolidate', 'prune'],
                        description: 'Memory management action'
                    },
                    content: {
                        type: 'object',
                        description: 'Content to store or search criteria for retrieval'
                    },
                    memoryType: {
                        type: 'string',
                        description: 'Type of memory to manage'
                    },
                    priority: {
                        type: 'string',
                        enum: ['low', 'medium', 'high', 'critical'],
                        description: 'Priority level for memory operations'
                    }
                },
                required: ['action']
            },
            func: async (params: any) => {
                return this.manageMemory(params, config)
            }
        })

        // Performance evaluation tool
        tools.push({
            name: 'evaluate_performance',
            description: 'Evaluate agent performance and identify areas for improvement',
            schema: {
                type: 'object',
                properties: {
                    executionResults: {
                        type: 'array',
                        description: 'Results from recent executions'
                    },
                    metrics: {
                        type: 'object',
                        description: 'Performance metrics to evaluate'
                    },
                    baseline: {
                        type: 'object',
                        description: 'Baseline performance expectations'
                    },
                    evaluationCriteria: {
                        type: 'array',
                        description: 'Specific criteria for performance evaluation'
                    }
                },
                required: ['executionResults']
            },
            func: async (params: any) => {
                return this.evaluatePerformance(params, config)
            }
        })

        return tools
    }

    private async analyzeExperience(params: any, config: any): Promise<any> {
        const { experiences, analysisType, timeRange } = params
        const { model, experienceWindow } = config

        try {
            // Filter experiences by time range if specified
            let filteredExperiences = experiences
            if (timeRange && timeRange !== 'all_time') {
                filteredExperiences = this.filterExperiencesByTime(experiences, timeRange)
            }

            // Limit to experience window
            filteredExperiences = filteredExperiences.slice(-experienceWindow)

            // Perform analysis based on type
            let analysisResult
            switch (analysisType) {
                case 'patterns':
                    analysisResult = await this.analyzePatterns(filteredExperiences, model)
                    break
                case 'trends':
                    analysisResult = await this.analyzeTrends(filteredExperiences, model)
                    break
                case 'anomalies':
                    analysisResult = await this.analyzeAnomalies(filteredExperiences, model)
                    break
                case 'correlations':
                    analysisResult = await this.analyzeCorrelations(filteredExperiences, model)
                    break
                default:
                    analysisResult = await this.analyzePatterns(filteredExperiences, model)
            }

            return {
                success: true,
                analysisType,
                timeRange: timeRange || 'all_time',
                experienceCount: filteredExperiences.length,
                insights: analysisResult.insights,
                confidence: analysisResult.confidence,
                recommendations: analysisResult.recommendations,
                timestamp: new Date().toISOString()
            }

        } catch (error) {
            return {
                success: false,
                error: error.message,
                analysisType,
                timestamp: new Date().toISOString()
            }
        }
    }

    private filterExperiencesByTime(experiences: any[], timeRange: string): any[] {
        const now = new Date()
        let cutoffDate: Date

        switch (timeRange) {
            case 'last_24_hours':
                cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
                break
            case 'last_7_days':
                cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                break
            case 'last_30_days':
                cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                break
            case 'last_90_days':
                cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
                break
            default:
                return experiences
        }

        return experiences.filter(exp => new Date(exp.timestamp) >= cutoffDate)
    }

    private async analyzePatterns(experiences: any[], model: BaseChatModel): Promise<any> {
        const patternPrompt = `Analyze these execution experiences to identify patterns:

Experiences: ${JSON.stringify(experiences, null, 2)}

Identify:
1. Common success patterns
2. Common failure patterns
3. Decision-making patterns
4. Resource usage patterns
5. Contextual factors that influence outcomes

Provide insights and recommendations for improvement.`

        const response = await model.invoke([{
            role: 'user',
            content: patternPrompt
        }])

        return {
            insights: this.extractInsights(response.content as string),
            confidence: 0.8,
            recommendations: this.extractRecommendations(response.content as string)
        }
    }

    private async analyzeTrends(experiences: any[], model: BaseChatModel): Promise<any> {
        const trendPrompt = `Analyze trends in these execution experiences:

Experiences: ${JSON.stringify(experiences, null, 2)}

Identify:
1. Performance trends over time
2. Changing patterns in decision making
3. Evolution of success rates
4. Shifts in resource utilization
5. Emerging opportunities or challenges

Provide trend analysis and future predictions.`

        const response = await model.invoke([{
            role: 'user',
            content: trendPrompt
        }])

        return {
            insights: this.extractInsights(response.content as string),
            confidence: 0.75,
            recommendations: this.extractRecommendations(response.content as string)
        }
    }

    private async analyzeAnomalies(experiences: any[], model: BaseChatModel): Promise<any> {
        const anomalyPrompt = `Detect anomalies in these execution experiences:

Experiences: ${JSON.stringify(experiences, null, 2)}

Identify:
1. Unusual execution patterns
2. Outlier performance results
3. Unexpected decision outcomes
4. Abnormal resource consumption
5. Contextual anomalies

Explain potential causes and impacts of anomalies.`

        const response = await model.invoke([{
            role: 'user',
            content: anomalyPrompt
        }])

        return {
            insights: this.extractInsights(response.content as string),
            confidence: 0.7,
            recommendations: this.extractRecommendations(response.content as string)
        }
    }

    private async analyzeCorrelations(experiences: any[], model: BaseChatModel): Promise<any> {
        const correlationPrompt = `Find correlations in these execution experiences:

Experiences: ${JSON.stringify(experiences, null, 2)}

Identify correlations between:
1. Input characteristics and outcomes
2. Decision factors and success rates
3. Resource allocation and performance
4. Contextual variables and results
5. Time-based patterns and effectiveness

Provide correlation analysis and actionable insights.`

        const response = await model.invoke([{
            role: 'user',
            content: correlationPrompt
        }])

        return {
            insights: this.extractInsights(response.content as string),
            confidence: 0.85,
            recommendations: this.extractRecommendations(response.content as string)
        }
    }

    private extractInsights(text: string): string[] {
        // Simple extraction - in production, use more sophisticated NLP
        const insights = []
        const lines = text.split('\n')

        for (const line of lines) {
            if (line.toLowerCase().includes('insight') ||
                line.toLowerCase().includes('pattern') ||
                line.toLowerCase().includes('trend') ||
                line.toLowerCase().includes('correlation')) {
                insights.push(line.trim())
            }
        }

        return insights
    }

    private extractRecommendations(text: string): string[] {
        // Simple extraction - in production, use more sophisticated NLP
        const recommendations = []
        const lines = text.split('\n')

        for (const line of lines) {
            if (line.toLowerCase().includes('recommend') ||
                line.toLowerCase().includes('suggest') ||
                line.toLowerCase().includes('should') ||
                line.toLowerCase().includes('consider')) {
                recommendations.push(line.trim())
            }
        }

        return recommendations
    }

    private async adaptBehavior(params: any, config: any): Promise<any> {
        const { insights, currentBehavior, performanceMetrics, adaptationScope } = params
        const { model, learningRate, adaptationStrategy, performanceThreshold } = config

        try {
            // Evaluate if adaptation is needed
            const needsAdaptation = this.evaluateAdaptationNeed(
                performanceMetrics,
                performanceThreshold,
                adaptationStrategy
            )

            if (!needsAdaptation) {
                return {
                    success: true,
                    adapted: false,
                    reason: 'Performance meets threshold, no adaptation needed',
                    currentBehavior,
                    timestamp: new Date().toISOString()
                }
            }

            // Generate adaptation recommendations
            const adaptationPlan = await this.generateAdaptationPlan(
                insights,
                currentBehavior,
                performanceMetrics,
                adaptationScope,
                learningRate,
                model
            )

            // Apply adaptations
            const adaptedBehavior = this.applyAdaptations(
                currentBehavior,
                adaptationPlan,
                adaptationScope
            )

            return {
                success: true,
                adapted: true,
                adaptationPlan,
                originalBehavior: currentBehavior,
                adaptedBehavior,
                scope: adaptationScope,
                learningRate,
                confidence: adaptationPlan.confidence,
                timestamp: new Date().toISOString()
            }

        } catch (error) {
            return {
                success: false,
                error: error.message,
                adapted: false,
                timestamp: new Date().toISOString()
            }
        }
    }

    private evaluateAdaptationNeed(metrics: any, threshold: number, strategy: string): boolean {
        if (!metrics || !metrics.overallScore) return false

        const score = metrics.overallScore

        switch (strategy) {
            case 'conservative':
                return score < threshold * 0.9 // Only adapt if significantly below threshold
            case 'aggressive':
                return score < threshold * 1.1 // Adapt even if slightly below threshold
            case 'balanced':
            default:
                return score < threshold // Adapt if below threshold
        }
    }

    private async generateAdaptationPlan(
        insights: any,
        currentBehavior: any,
        metrics: any,
        scope: string,
        learningRate: number,
        model: BaseChatModel
    ): Promise<any> {
        const adaptationPrompt = `Generate an adaptation plan based on insights and performance:

Insights: ${JSON.stringify(insights, null, 2)}
Current Behavior: ${JSON.stringify(currentBehavior, null, 2)}
Performance Metrics: ${JSON.stringify(metrics, null, 2)}
Adaptation Scope: ${scope}
Learning Rate: ${learningRate}

Create a specific plan for behavioral adaptations that will improve performance.
Consider the learning rate and scope when determining the magnitude of changes.`

        const response = await model.invoke([{
            role: 'user',
            content: adaptationPrompt
        }])

        return JSON.parse(response.content as string)
    }

    private applyAdaptations(currentBehavior: any, adaptationPlan: any, scope: string): any {
        const adaptedBehavior = { ...currentBehavior }

        // Apply adaptations based on scope
        const adaptationMagnitude = this.getAdaptationMagnitude(scope)

        for (const adaptation of adaptationPlan.adaptations) {
            if (adaptedBehavior.hasOwnProperty(adaptation.parameter)) {
                const currentValue = adaptedBehavior[adaptation.parameter]
                const targetValue = adaptation.targetValue
                const change = (targetValue - currentValue) * adaptationMagnitude

                adaptedBehavior[adaptation.parameter] = currentValue + change
            }
        }

        return adaptedBehavior
    }

    private getAdaptationMagnitude(scope: string): number {
        switch (scope) {
            case 'minor':
                return 0.1
            case 'moderate':
                return 0.3
            case 'major':
                return 0.7
            default:
                return 0.3
        }
    }

    private async manageMemory(params: any, config: any): Promise<any> {
        const { action, content, memoryType, priority } = params
        const { memoryType: agentMemoryType } = config

        try {
            const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            switch (action) {
                case 'store':
                    return await this.storeMemory(content, memoryType || agentMemoryType, priority, memoryId)

                case 'retrieve':
                    return await this.retrieveMemory(content, memoryType || agentMemoryType)

                case 'update':
                    return await this.updateMemory(content, memoryType || agentMemoryType)

                case 'consolidate':
                    return await this.consolidateMemory(memoryType || agentMemoryType)

                case 'prune':
                    return await this.pruneMemory(memoryType || agentMemoryType)

                default:
                    throw new Error(`Unknown memory action: ${action}`)
            }

        } catch (error) {
            return {
                success: false,
                action,
                error: error.message,
                timestamp: new Date().toISOString()
            }
        }
    }

    private async storeMemory(content: any, memoryType: string, priority: string, memoryId: string): Promise<any> {
        // In a real implementation, this would store in a database
        const memoryEntry = {
            id: memoryId,
            type: memoryType,
            content,
            priority: priority || 'medium',
            timestamp: new Date().toISOString(),
            accessCount: 0,
            lastAccessed: new Date().toISOString()
        }

        // Simulate storage
        console.log('Storing memory:', memoryEntry)

        return {
            success: true,
            action: 'store',
            memoryId,
            memoryType,
            stored: true,
            timestamp: new Date().toISOString()
        }
    }

    private async retrieveMemory(searchCriteria: any, memoryType: string): Promise<any> {
        // In a real implementation, this would query a database
        // Simulate retrieval based on criteria
        const mockMemories = [
            {
                id: 'mem_001',
                type: memoryType,
                content: { pattern: 'successful_approach', confidence: 0.9 },
                relevance: 0.85
            }
        ]

        return {
            success: true,
            action: 'retrieve',
            memories: mockMemories,
            count: mockMemories.length,
            searchCriteria,
            timestamp: new Date().toISOString()
        }
    }

    private async updateMemory(content: any, memoryType: string): Promise<any> {
        // Simulate memory update
        return {
            success: true,
            action: 'update',
            updated: true,
            memoryType,
            timestamp: new Date().toISOString()
        }
    }

    private async consolidateMemory(memoryType: string): Promise<any> {
        // Simulate memory consolidation
        return {
            success: true,
            action: 'consolidate',
            consolidated: true,
            memoryType,
            entriesProcessed: 25,
            timestamp: new Date().toISOString()
        }
    }

    private async pruneMemory(memoryType: string): Promise<any> {
        // Simulate memory pruning
        return {
            success: true,
            action: 'prune',
            pruned: true,
            memoryType,
            entriesRemoved: 5,
            timestamp: new Date().toISOString()
        }
    }

    private async evaluatePerformance(params: any, config: any): Promise<any> {
        const { executionResults, metrics, baseline, evaluationCriteria } = params
        const { model, performanceThreshold } = config

        try {
            // Calculate performance metrics
            const calculatedMetrics = this.calculatePerformanceMetrics(executionResults)

            // Compare against baseline
            const baselineComparison = this.compareAgainstBaseline(calculatedMetrics, baseline)

            // Evaluate against criteria
            const criteriaEvaluation = this.evaluateAgainstCriteria(
                calculatedMetrics,
                evaluationCriteria || this.getDefaultCriteria()
            )

            // Generate overall assessment
            const overallAssessment = await this.generatePerformanceAssessment(
                calculatedMetrics,
                baselineComparison,
                criteriaEvaluation,
                model
            )

            return {
                success: true,
                metrics: calculatedMetrics,
                baselineComparison,
                criteriaEvaluation,
                overallAssessment,
                meetsThreshold: overallAssessment.score >= performanceThreshold,
                improvementAreas: overallAssessment.improvementAreas,
                strengths: overallAssessment.strengths,
                timestamp: new Date().toISOString()
            }

        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            }
        }
    }

    private calculatePerformanceMetrics(results: any[]): any {
        if (!results || results.length === 0) {
            return { overallScore: 0, sampleSize: 0 }
        }

        const totalScore = results.reduce((sum, result) => sum + (result.score || 0), 0)
        const averageScore = totalScore / results.length

        const successRate = results.filter(r => r.success).length / results.length
        const averageExecutionTime = results.reduce((sum, r) => sum + (r.executionTime || 0), 0) / results.length

        return {
            overallScore: averageScore,
            successRate,
            averageExecutionTime,
            sampleSize: results.length,
            minScore: Math.min(...results.map(r => r.score || 0)),
            maxScore: Math.max(...results.map(r => r.score || 0))
        }
    }

    private compareAgainstBaseline(metrics: any, baseline: any): any {
        if (!baseline) {
            return { comparison: 'no_baseline_available' }
        }

        const improvements = []
        const regressions = []

        for (const [key, value] of Object.entries(metrics)) {
            if (baseline.hasOwnProperty(key) && typeof value === 'number') {
                const baselineValue = baseline[key]
                const change = value - baselineValue
                const percentChange = baselineValue !== 0 ? (change / baselineValue) * 100 : 0

                if (change > 0) {
                    improvements.push({ metric: key, change, percentChange })
                } else if (change < 0) {
                    regressions.push({ metric: key, change, percentChange })
                }
            }
        }

        return {
            improvements,
            regressions,
            netChange: improvements.length - regressions.length
        }
    }

    private evaluateAgainstCriteria(metrics: any, criteria: any[]): any {
        const evaluations = []

        for (const criterion of criteria) {
            const value = metrics[criterion.metric]
            let meetsCriterion = false
            let score = 0

            if (value !== undefined) {
                switch (criterion.operator) {
                    case 'greater_than':
                        meetsCriterion = value > criterion.threshold
                        score = Math.min(1, value / (criterion.threshold * 1.2))
                        break
                    case 'less_than':
                        meetsCriterion = value < criterion.threshold
                        score = Math.min(1, criterion.threshold / (value || 1))
                        break
                    case 'equal':
                        meetsCriterion = Math.abs(value - criterion.threshold) < 0.1
                        score = 1 - Math.abs(value - criterion.threshold)
                        break
                }
            }

            evaluations.push({
                criterion: criterion.name,
                metric: criterion.metric,
                threshold: criterion.threshold,
                actual: value,
                meets: meetsCriterion,
                score
            })
        }

        return evaluations
    }

    private getDefaultCriteria(): any[] {
        return [
            { name: 'Success Rate', metric: 'successRate', operator: 'greater_than', threshold: 0.8 },
            { name: 'Overall Score', metric: 'overallScore', operator: 'greater_than', threshold: 0.7 },
            { name: 'Execution Time', metric: 'averageExecutionTime', operator: 'less_than', threshold: 30000 } // 30 seconds
        ]
    }

    private async generatePerformanceAssessment(
        metrics: any,
        baselineComparison: any,
        criteriaEvaluation: any,
        model: BaseChatModel
    ): Promise<any> {
        const assessmentPrompt = `Assess overall performance based on metrics and evaluations:

Metrics: ${JSON.stringify(metrics, null, 2)}
Baseline Comparison: ${JSON.stringify(baselineComparison, null, 2)}
Criteria Evaluation: ${JSON.stringify(criteriaEvaluation, null, 2)}

Provide:
1. Overall performance score (0-1)
2. Key strengths
3. Areas for improvement
4. Specific recommendations

Be specific and actionable in your assessment.`

        const response = await model.invoke([{
            role: 'user',
            content: assessmentPrompt
        }])

        const assessment = JSON.parse(response.content as string)

        return {
            ...assessment,
            criteriaMet: criteriaEvaluation.filter((c: any) => c.meets).length,
            totalCriteria: criteriaEvaluation.length
        }
    }
}

module.exports = { nodeClass: LearningAgent_Agents }