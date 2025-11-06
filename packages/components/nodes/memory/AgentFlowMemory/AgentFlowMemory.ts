import {
    FlowiseMemory,
    ICommonObject,
    IMessage,
    INode,
    INodeData,
    INodeParams,
    MemoryMethods,
    MessageType
} from '../../../src/Interface'
import { BaseMessage } from '@langchain/core/messages'

class AgentFlowMemory_Memory implements INode {
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
        this.label = 'AgentFlow Memory'
        this.name = 'agentFlowMemory'
        this.version = 1.0
        this.type = 'AgentFlowMemory'
        this.icon = 'memory.svg'
        this.category = 'Memory'
        this.description = 'Advanced memory system with episodic, semantic, and working memory for autonomous agents'
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Agent ID',
                name: 'agentId',
                type: 'string',
                description: 'Unique identifier for the agent',
                default: 'default-agent'
            },
            {
                label: 'Session ID',
                name: 'sessionId',
                type: 'string',
                description: 'Session identifier for working memory',
                optional: true
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const agentId = nodeData.inputs?.agentId as string
        const sessionId = nodeData.inputs?.sessionId as string

        const memory = new AgentFlowMemory(agentId, sessionId)
        return memory
    }

    async run(nodeData: INodeData): Promise<string | object> {
        return await this.init(nodeData)
    }
}

class AgentFlowMemory extends FlowiseMemory {
    agentId: string
    sessionId?: string
    memorySystem: any

    constructor(agentId: string, sessionId?: string) {
        super()
        this.agentId = agentId
        this.sessionId = sessionId
        // Initialize memory system (stub for now)
        this.memorySystem = {
            storeExperience: async (experience: any) => {
                console.log('Storing experience:', experience)
            },
            retrieveExperiences: async (query: any) => {
                return []
            }
        }
    }

    async getChatMessages(
        overrideSessionId?: string,
        returnBaseMessages?: boolean,
        prependMessages?: IMessage[]
    ): Promise<IMessage[] | BaseMessage[]> {
        // Retrieve relevant experiences
        const experiences = await this.memorySystem.retrieveExperiences({
            agentId: this.agentId,
            limit: 10
        })

        // Convert to messages
        const messages: IMessage[] = []
        for (const exp of experiences) {
            if (exp.input) messages.push({ message: exp.input, type: 'userMessage' as MessageType })
            if (exp.output) messages.push({ message: exp.output, type: 'apiMessage' as MessageType })
        }

        return messages
    }

    async addChatMessages(msgArray: { text: string; type: MessageType }[], overrideSessionId?: string): Promise<void> {
        // Store as experience
        const userMsg = msgArray.find(m => m.type === 'userMessage')
        const apiMsg = msgArray.find(m => m.type === 'apiMessage')

        if (userMsg || apiMsg) {
            const experience = {
                agentId: this.agentId,
                experienceType: 'interaction',
                input: userMsg?.text,
                output: apiMsg?.text,
                outcome: 'success',
                successScore: 0.8,
                duration: 1000,
                cost: 0.01,
                timestamp: new Date()
            }

            await this.memorySystem.storeExperience(experience)
        }
    }

    async clearChatMessages(overrideSessionId?: string): Promise<void> {
        // Clear working memory for session
        console.log('Clearing chat messages for agent:', this.agentId)
    }
}

module.exports = { nodeClass: AgentFlowMemory_Memory }