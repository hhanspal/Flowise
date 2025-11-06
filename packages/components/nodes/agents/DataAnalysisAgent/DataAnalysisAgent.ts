import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { getBaseClasses } from '../../../src/utils'
import { ConsoleCallbackHandler, additionalCallbacks } from '../../../src/handler'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class DataAnalysisAgent_Agents implements INode {
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
        this.label = 'Data Analysis Agent'
        this.name = 'dataAnalysisAgent'
        this.version = 1.0
        this.type = 'DataAnalysisAgent'
        this.category = 'Agents'
        this.icon = 'agent.svg'
        this.description = 'Autonomous data analysis agent for processing datasets, generating insights, and creating visualizations using AgentFlowOS framework'
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Data Input',
                name: 'dataInput',
                type: 'string',
                description: 'Raw data, dataset description, or analysis request'
            },
            {
                label: 'Chat Model',
                name: 'model',
                type: 'BaseChatModel',
                description: 'LLM model to use for data analysis and insight generation'
            },
            {
                label: 'Analysis Type',
                name: 'analysisType',
                type: 'string',
                description: 'Type of analysis needed (exploratory, statistical, predictive, etc.)',
                optional: true
            },
            {
                label: 'Data Context',
                name: 'dataContext',
                type: 'string',
                description: 'Additional context about the data source, business domain, or analysis goals',
                optional: true
            },
            {
                label: 'Output Format',
                name: 'outputFormat',
                type: 'string',
                description: 'Desired output format (insights, visualization, report, etc.)',
                optional: true
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const dataInput = nodeData.inputs?.dataInput as string
        const model = nodeData.inputs?.model as BaseChatModel
        const analysisType = nodeData.inputs?.analysisType as string
        const dataContext = nodeData.inputs?.dataContext as string
        const outputFormat = nodeData.inputs?.outputFormat as string

        if (!dataInput) {
            throw new Error('Data input is required')
        }
        if (!model) {
            throw new Error('Chat Model is required')
        }

        return { dataInput, model, analysisType, dataContext, outputFormat }
    }

    async run(nodeData: INodeData, input: string, options: ICommonObject): Promise<string | object> {
        const { dataInput, model, analysisType, dataContext, outputFormat } = await this.init(nodeData)

        const loggerHandler = new ConsoleCallbackHandler(options.logger, options?.orgId)
        const callbacks = await additionalCallbacks(nodeData, options)

        try {
            // Generate data analysis and insights
            const analysis = await this.analyzeData(
                dataInput,
                model,
                analysisType || 'exploratory',
                dataContext || '',
                outputFormat || 'insights',
                callbacks
            )

            return {
                insights: analysis.insights,
                keyFindings: analysis.keyFindings,
                recommendations: analysis.recommendations,
                dataQuality: analysis.dataQuality,
                confidence: analysis.confidence,
                visualizations: analysis.visualizations
            }
        } catch (error) {
            throw new Error(`Data analysis failed: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    private async analyzeData(
        dataInput: string,
        model: BaseChatModel,
        analysisType: string,
        dataContext: string,
        outputFormat: string,
        callbacks: any[]
    ): Promise<any> {
        const prompt = this.buildAnalysisPrompt(dataInput, analysisType, dataContext, outputFormat)

        const response = await model.invoke([{
            role: 'user',
            content: prompt
        }], { callbacks })

        const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content)

        try {
            const parsed = JSON.parse(content)
            return this.validateAnalysis(parsed)
        } catch (error) {
            // Fallback: try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                return this.validateAnalysis(JSON.parse(jsonMatch[0]))
            }
            throw new Error('Failed to parse data analysis as JSON')
        }
    }

    private buildAnalysisPrompt(dataInput: string, analysisType: string, dataContext: string, outputFormat: string): string {
        return `
You are an expert data analysis agent. Analyze the provided data and generate meaningful insights.

Data Input: ${dataInput}

Analysis Type: ${analysisType}

${dataContext ? `Data Context: ${dataContext}` : ''}

Output Format: ${outputFormat}

Please provide a JSON response with the following structure:
{
  "insights": "High-level summary of key insights and patterns discovered",
  "keyFindings": [
    "Finding 1 with specific data points",
    "Finding 2 with statistical evidence",
    "Finding 3 with trend analysis"
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "Strategic recommendation 3"
  ],
  "dataQuality": "assessment of data completeness, accuracy, and reliability",
  "confidence": 0.0-1.0,
  "visualizations": [
    "Recommended chart type 1 for metric A",
    "Recommended chart type 2 for trend B",
    "Dashboard layout suggestion"
  ],
  "statisticalSummary": {
    "keyMetrics": {"metric1": "value", "metric2": "value"},
    "correlations": ["correlation1", "correlation2"],
    "outliers": ["outlier1", "outlier2"]
  },
  "nextSteps": ["step1", "step2", "step3"]
}

Guidelines:
1. Identify meaningful patterns and trends in the data
2. Calculate relevant statistics and metrics
3. Assess data quality and identify potential issues
4. Provide actionable insights and recommendations
5. Suggest appropriate visualizations for the findings
6. Consider the business context and analysis objectives
7. Be specific with data points and evidence
8. Prioritize insights by importance and impact
`
    }

    private validateAnalysis(parsed: any): any {
        if (!parsed.insights || typeof parsed.insights !== 'string') {
            throw new Error('Invalid analysis: missing or invalid insights')
        }

        if (!parsed.keyFindings || !Array.isArray(parsed.keyFindings)) {
            throw new Error('Invalid analysis: missing or invalid keyFindings')
        }

        if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
            throw new Error('Invalid analysis: missing or invalid recommendations')
        }

        if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
            throw new Error('Invalid analysis: missing or invalid confidence')
        }

        return parsed
    }
}

module.exports = { nodeClass: DataAnalysisAgent_Agents }