import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'

class CollaborativeAgent_Agents implements INode {
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
        this.label = 'Collaborative Agent'
        this.name = 'collaborativeAgent'
        this.version = 1.0
        this.type = 'CollaborativeAgent'
        this.category = 'Agents'
        this.icon = 'collaboration.svg'
        this.description = 'Multi-agent collaboration agent that coordinates with other agents in complex workflows'
        this.baseClasses = [this.type, 'BaseChatModel', 'Tool']
        this.inputs = [
            {
                label: 'Chat Model',
                name: 'model',
                type: 'BaseChatModel'
            },
            {
                label: 'Agent Role',
                name: 'agentRole',
                type: 'string',
                description: 'The specific role this agent plays in the collaboration',
                default: 'Coordinator'
            },
            {
                label: 'Collaboration Strategy',
                name: 'collaborationStrategy',
                type: 'options',
                options: [
                    { label: 'Sequential Processing', name: 'sequential' },
                    { label: 'Parallel Processing', name: 'parallel' },
                    { label: 'Hierarchical Coordination', name: 'hierarchical' },
                    { label: 'Consensus-Based', name: 'consensus' }
                ],
                default: 'sequential'
            },
            {
                label: 'Team Members',
                name: 'teamMembers',
                type: 'string',
                description: 'JSON array of team member configurations',
                default: '[{"name": "Analyzer", "role": "Data Analysis", "expertise": "pattern recognition"}, {"name": "Planner", "role": "Strategy", "expertise": "optimization"}]'
            },
            {
                label: 'Shared Context',
                name: 'sharedContext',
                type: 'boolean',
                description: 'Enable shared context between team members',
                default: true
            },
            {
                label: 'Communication Protocol',
                name: 'communicationProtocol',
                type: 'options',
                options: [
                    { label: 'Direct Messaging', name: 'direct' },
                    { label: 'Broadcast', name: 'broadcast' },
                    { label: 'Hierarchical', name: 'hierarchical' }
                ],
                default: 'direct'
            },
            {
                label: 'Conflict Resolution',
                name: 'conflictResolution',
                type: 'options',
                options: [
                    { label: 'Majority Vote', name: 'majority' },
                    { label: 'Expert Authority', name: 'expert' },
                    { label: 'Coordinator Override', name: 'coordinator' },
                    { label: 'Consensus Required', name: 'consensus' }
                ],
                default: 'consensus'
            },
            {
                label: 'Max Collaboration Rounds',
                name: 'maxRounds',
                type: 'number',
                description: 'Maximum number of collaboration rounds before finalizing decision',
                default: 3
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const model = nodeData.inputs?.model as BaseChatModel
        const agentRole = nodeData.inputs?.agentRole as string
        const collaborationStrategy = nodeData.inputs?.collaborationStrategy as string
        const teamMembers = nodeData.inputs?.teamMembers as string
        const sharedContext = nodeData.inputs?.sharedContext as boolean
        const communicationProtocol = nodeData.inputs?.communicationProtocol as string
        const conflictResolution = nodeData.inputs?.conflictResolution as string
        const maxRounds = nodeData.inputs?.maxRounds as number

        if (!model) {
            throw new Error('Chat Model is required')
        }

        let team = []
        try {
            team = JSON.parse(teamMembers || '[]')
        } catch (error) {
            throw new Error('Invalid team members JSON')
        }

        return {
            model,
            agentRole: agentRole || 'Coordinator',
            collaborationStrategy: collaborationStrategy || 'sequential',
            teamMembers: team,
            sharedContext: sharedContext !== false,
            communicationProtocol: communicationProtocol || 'direct',
            conflictResolution: conflictResolution || 'consensus',
            maxRounds: maxRounds || 3
        }
    }

    async run(nodeData: INodeData): Promise<string | object> {
        const config = await this.init(nodeData)

        const tools = await this.createCollaborationTools(config)
        return tools
    }

    private async createCollaborationTools(config: any): Promise<any[]> {
        const tools = []

        // Team coordination tool
        tools.push({
            name: 'coordinate_team',
            description: 'Coordinate team activities and manage collaboration workflow',
            schema: {
                type: 'object',
                properties: {
                    task: {
                        type: 'object',
                        description: 'The main task to be accomplished by the team'
                    },
                    context: {
                        type: 'object',
                        description: 'Shared context and background information'
                    },
                    constraints: {
                        type: 'object',
                        description: 'Time, resource, and other constraints'
                    }
                },
                required: ['task']
            },
            func: async (params: any) => {
                return this.coordinateTeam(params, config)
            }
        })

        // Agent communication tool
        tools.push({
            name: 'communicate_with_agent',
            description: 'Send messages to specific team members or broadcast to all',
            schema: {
                type: 'object',
                properties: {
                    recipient: {
                        type: 'string',
                        description: 'Name of the recipient agent (or "all" for broadcast)'
                    },
                    message: {
                        type: 'string',
                        description: 'Message content to send'
                    },
                    messageType: {
                        type: 'string',
                        enum: ['request', 'response', 'update', 'question', 'proposal'],
                        description: 'Type of communication'
                    },
                    priority: {
                        type: 'string',
                        enum: ['low', 'normal', 'high', 'urgent'],
                        description: 'Message priority level'
                    }
                },
                required: ['recipient', 'message']
            },
            func: async (params: any) => {
                return this.communicateWithAgent(params, config)
            }
        })

        // Consensus building tool
        tools.push({
            name: 'build_consensus',
            description: 'Facilitate consensus building among team members on decisions or proposals',
            schema: {
                type: 'object',
                properties: {
                    proposal: {
                        type: 'object',
                        description: 'The proposal or decision to build consensus on'
                    },
                    participants: {
                        type: 'array',
                        description: 'List of agents to include in consensus building'
                    },
                    deadline: {
                        type: 'string',
                        description: 'Deadline for reaching consensus (ISO date string)'
                    }
                },
                required: ['proposal']
            },
            func: async (params: any) => {
                return this.buildConsensus(params, config)
            }
        })

        // Conflict resolution tool
        tools.push({
            name: 'resolve_conflict',
            description: 'Resolve conflicts between team members using configured strategy',
            schema: {
                type: 'object',
                properties: {
                    conflict: {
                        type: 'object',
                        description: 'Description of the conflict situation'
                    },
                    parties: {
                        type: 'array',
                        description: 'Agents involved in the conflict'
                    },
                    resolutionStrategy: {
                        type: 'string',
                        description: 'Override default conflict resolution strategy'
                    }
                },
                required: ['conflict', 'parties']
            },
            func: async (params: any) => {
                return this.resolveConflict(params, config)
            }
        })

        return tools
    }

    private async coordinateTeam(params: any, config: any): Promise<any> {
        const { task, context, constraints } = params
        const { model, agentRole, collaborationStrategy, teamMembers, sharedContext, maxRounds } = config

        try {
            // Initialize collaboration session
            const sessionId = `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            // Create team member instances (simulated for now)
            const activeTeam = teamMembers.map((member: any) => ({
                ...member,
                status: 'available',
                contributions: [],
                lastActivity: new Date().toISOString()
            }))

            // Execute collaboration based on strategy
            let collaborationResult
            switch (collaborationStrategy) {
                case 'sequential':
                    collaborationResult = await this.executeSequentialCollaboration(task, context, activeTeam, model, maxRounds)
                    break
                case 'parallel':
                    collaborationResult = await this.executeParallelCollaboration(task, context, activeTeam, model, maxRounds)
                    break
                case 'hierarchical':
                    collaborationResult = await this.executeHierarchicalCollaboration(task, context, activeTeam, model, maxRounds)
                    break
                case 'consensus':
                    collaborationResult = await this.executeConsensusCollaboration(task, context, activeTeam, model, maxRounds)
                    break
                default:
                    throw new Error(`Unknown collaboration strategy: ${collaborationStrategy}`)
            }

            return {
                success: true,
                sessionId,
                strategy: collaborationStrategy,
                coordinator: agentRole,
                teamSize: activeTeam.length,
                rounds: collaborationResult.rounds,
                finalResult: collaborationResult.finalResult,
                teamContributions: collaborationResult.contributions,
                sharedContext: sharedContext ? collaborationResult.sharedContext : null,
                executionTime: collaborationResult.executionTime
            }

        } catch (error) {
            return {
                success: false,
                error: error.message,
                sessionId: null,
                strategy: collaborationStrategy,
                coordinator: agentRole
            }
        }
    }

    private async executeSequentialCollaboration(task: any, context: any, team: any[], model: BaseChatModel, maxRounds: number): Promise<any> {
        const contributions: any[] = []
        let currentContext = { ...context }
        const startTime = Date.now()

        for (let round = 1; round <= maxRounds; round++) {
            for (const member of team) {
                const memberContribution = await this.getMemberContribution(member, task, currentContext, round, model)
                contributions.push({
                    round,
                    member: member.name,
                    contribution: memberContribution,
                    timestamp: new Date().toISOString()
                })

                // Update shared context
                if (memberContribution.updatesContext) {
                    currentContext = { ...currentContext, ...memberContribution.contextUpdates }
                }

                // Check if task is complete
                if (memberContribution.taskComplete) {
                    return {
                        rounds: round,
                        finalResult: memberContribution.finalResult,
                        contributions,
                        sharedContext: currentContext,
                        executionTime: Date.now() - startTime
                    }
                }
            }
        }

        // Synthesize final result if max rounds reached
        const finalResult = await this.synthesizeFinalResult(contributions, task, model)

        return {
            rounds: maxRounds,
            finalResult,
            contributions,
            sharedContext: currentContext,
            executionTime: Date.now() - startTime
        }
    }

    private async executeParallelCollaboration(task: any, context: any, team: any[], model: BaseChatModel, maxRounds: number): Promise<any> {
        const contributions = []
        const startTime = Date.now()

        // All team members work in parallel
        const parallelPromises = team.map(member =>
            this.getMemberContribution(member, task, context, 1, model)
        )

        const parallelResults = await Promise.all(parallelPromises)

        parallelResults.forEach((result, index) => {
            contributions.push({
                round: 1,
                member: team[index].name,
                contribution: result,
                timestamp: new Date().toISOString()
            })
        })

        // Synthesize results from parallel execution
        const finalResult = await this.synthesizeParallelResults(parallelResults, task, model)

        return {
            rounds: 1,
            finalResult,
            contributions,
            sharedContext: context,
            executionTime: Date.now() - startTime
        }
    }

    private async executeHierarchicalCollaboration(task: any, context: any, team: any[], model: BaseChatModel, maxRounds: number): Promise<any> {
        const contributions = []
        const startTime = Date.now()

        // Identify coordinator (first team member or designated coordinator)
        const coordinator = team[0]
        const subordinates = team.slice(1)

        // Coordinator breaks down task
        const taskBreakdown = await this.breakDownTask(task, coordinator, model)

        // Assign subtasks to subordinates
        const subtaskPromises = subordinates.map((member, index) =>
            this.executeSubtask(member, taskBreakdown.subtasks[index] || taskBreakdown.subtasks[0], context, model)
        )

        const subtaskResults = await Promise.all(subtaskPromises)

        // Coordinator synthesizes results
        const finalResult = await this.coordinateSynthesis(coordinator, subtaskResults, task, model)

        subtaskResults.forEach((result, index) => {
            contributions.push({
                round: 1,
                member: subordinates[index].name,
                contribution: result,
                timestamp: new Date().toISOString()
            })
        })

        contributions.push({
            round: 2,
            member: coordinator.name,
            contribution: finalResult,
            timestamp: new Date().toISOString()
        })

        return {
            rounds: 2,
            finalResult,
            contributions,
            sharedContext: context,
            executionTime: Date.now() - startTime
        }
    }

    private async executeConsensusCollaboration(task: any, context: any, team: any[], model: BaseChatModel, maxRounds: number): Promise<any> {
        const contributions = []
        const startTime = Date.now()
        let consensusReached = false
        let currentProposal = null

        for (let round = 1; round <= maxRounds && !consensusReached; round++) {
            const roundContributions = []

            for (const member of team) {
                const memberInput = currentProposal ?
                    { ...task, currentProposal, previousRound: contributions } :
                    { ...task, initialProposal: true }

                const contribution = await this.getMemberContribution(member, memberInput, context, round, model)
                roundContributions.push({
                    round,
                    member: member.name,
                    contribution,
                    timestamp: new Date().toISOString()
                })
            }

            contributions.push(...roundContributions)

            // Check for consensus
            const consensusCheck = await this.checkConsensus(roundContributions, model)
            consensusReached = consensusCheck.reached
            currentProposal = consensusCheck.newProposal
        }

        return {
            rounds: consensusReached ? contributions.length / team.length : maxRounds,
            finalResult: consensusReached ? currentProposal : await this.forceConsensusResolution(contributions, model),
            contributions,
            sharedContext: context,
            executionTime: Date.now() - startTime
        }
    }

    private async getMemberContribution(member: any, task: any, context: any, round: number, model: BaseChatModel): Promise<any> {
        const contributionPrompt = `You are ${member.name}, a ${member.role} expert in ${member.expertise}.

Task: ${JSON.stringify(task, null, 2)}
Context: ${JSON.stringify(context, null, 2)}
Round: ${round}

Provide your contribution to this collaborative task. Consider:
1. Your specific expertise and role
2. How your contribution fits with the overall goal
3. What information you need from others
4. Any concerns or suggestions you have

Respond with a JSON object containing your analysis, recommendations, and any updates to shared context.`

        const response = await model.invoke([{
            role: 'user',
            content: contributionPrompt
        }])

        try {
            return JSON.parse(response.content as string)
        } catch (error) {
            return {
                contribution: response.content,
                analysis: 'Direct response',
                recommendations: [],
                contextUpdates: {},
                taskComplete: false,
                confidence: 0.7
            }
        }
    }

    private async synthesizeFinalResult(contributions: any[], task: any, model: BaseChatModel): Promise<any> {
        const synthesisPrompt = `Synthesize a final result from these team contributions:

Task: ${JSON.stringify(task, null, 2)}

Contributions:
${contributions.map(c => `${c.member} (Round ${c.round}): ${JSON.stringify(c.contribution)}`).join('\n\n')}

Create a comprehensive final result that incorporates the best aspects of all contributions.`

        const response = await model.invoke([{
            role: 'user',
            content: synthesisPrompt
        }])

        return {
            synthesis: response.content,
            incorporatedContributions: contributions.length,
            synthesisApproach: 'comprehensive_integration'
        }
    }

    private async synthesizeParallelResults(results: any[], task: any, model: BaseChatModel): Promise<any> {
        const synthesisPrompt = `Synthesize results from parallel team execution:

Task: ${JSON.stringify(task, null, 2)}

Parallel Results:
${results.map((r, i) => `Team Member ${i + 1}: ${JSON.stringify(r)}`).join('\n\n')}

Combine these parallel results into a cohesive final outcome.`

        const response = await model.invoke([{
            role: 'user',
            content: synthesisPrompt
        }])

        return {
            synthesis: response.content,
            parallelContributions: results.length,
            synthesisApproach: 'parallel_integration'
        }
    }

    private async breakDownTask(task: any, coordinator: any, model: BaseChatModel): Promise<any> {
        const breakdownPrompt = `As ${coordinator.name} (${coordinator.role}), break down this complex task into subtasks for your team:

Task: ${JSON.stringify(task, null, 2)}

Create 2-4 subtasks that can be executed by different team members with complementary expertise.`

        const response = await model.invoke([{
            role: 'user',
            content: breakdownPrompt
        }])

        return JSON.parse(response.content as string)
    }

    private async executeSubtask(member: any, subtask: any, context: any, model: BaseChatModel): Promise<any> {
        const subtaskPrompt = `You are ${member.name}, executing this subtask:

Subtask: ${JSON.stringify(subtask, null, 2)}
Context: ${JSON.stringify(context, null, 2)}

Execute your assigned subtask and provide your results.`

        const response = await model.invoke([{
            role: 'user',
            content: subtaskPrompt
        }])

        return JSON.parse(response.content as string)
    }

    private async coordinateSynthesis(coordinator: any, subtaskResults: any[], task: any, model: BaseChatModel): Promise<any> {
        const synthesisPrompt = `As ${coordinator.name}, synthesize these subtask results into a final outcome:

Original Task: ${JSON.stringify(task, null, 2)}

Subtask Results:
${subtaskResults.map((r, i) => `Subtask ${i + 1}: ${JSON.stringify(r)}`).join('\n\n')}

Create the final result that achieves the original task objective.`

        const response = await model.invoke([{
            role: 'user',
            content: synthesisPrompt
        }])

        return JSON.parse(response.content as string)
    }

    private async checkConsensus(contributions: any[], model: BaseChatModel): Promise<any> {
        const consensusPrompt = `Evaluate if consensus has been reached among these contributions:

${contributions.map(c => `${c.member}: ${JSON.stringify(c.contribution)}`).join('\n\n')}

Determine:
1. If consensus is reached (majority agreement)
2. What the consensus position is
3. If another round of discussion is needed

Respond with JSON indicating consensus status and any new proposal.`

        const response = await model.invoke([{
            role: 'user',
            content: consensusPrompt
        }])

        return JSON.parse(response.content as string)
    }

    private async forceConsensusResolution(contributions: any[], model: BaseChatModel): Promise<any> {
        const resolutionPrompt = `Consensus was not reached. Based on all contributions, determine the best resolution:

All Contributions:
${contributions.map(c => `${c.member} (Round ${c.round}): ${JSON.stringify(c.contribution)}`).join('\n\n')}

Provide a final resolution that balances all perspectives.`

        const response = await model.invoke([{
            role: 'user',
            content: resolutionPrompt
        }])

        return {
            resolution: response.content,
            approach: 'forced_consensus',
            totalRounds: Math.max(...contributions.map(c => c.round))
        }
    }

    private async communicateWithAgent(params: any, config: any): Promise<any> {
        const { recipient, message, messageType, priority } = params
        const { communicationProtocol, teamMembers } = config

        // Validate recipient
        if (recipient !== 'all' && !teamMembers.find((m: any) => m.name === recipient)) {
            throw new Error(`Unknown recipient: ${recipient}`)
        }

        // Route message based on protocol
        const routing = this.routeMessage(recipient, communicationProtocol)

        return {
            success: true,
            messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            recipient,
            message,
            messageType: messageType || 'update',
            priority: priority || 'normal',
            routing,
            protocol: communicationProtocol,
            timestamp: new Date().toISOString()
        }
    }

    private routeMessage(recipient: string, protocol: string): any {
        switch (protocol) {
            case 'direct':
                return { type: 'direct', target: recipient }
            case 'broadcast':
                return { type: 'broadcast', targets: 'all' }
            case 'hierarchical':
                return { type: 'hierarchical', path: ['coordinator', recipient] }
            default:
                return { type: 'direct', target: recipient }
        }
    }

    private async buildConsensus(params: any, config: any): Promise<any> {
        const { proposal, participants, deadline } = params
        const { model, teamMembers, conflictResolution } = config

        const activeParticipants = participants || teamMembers.map((m: any) => m.name)
        const deadlineDate = deadline ? new Date(deadline) : new Date(Date.now() + 300000) // 5 minutes default

        // Simulate consensus building process
        const consensusProcess = await this.simulateConsensusBuilding(proposal, activeParticipants, deadlineDate, model)

        return {
            success: consensusProcess.reached,
            proposal: proposal,
            participants: activeParticipants,
            consensus: consensusProcess.consensus,
            votes: consensusProcess.votes,
            deadline: deadlineDate.toISOString(),
            resolutionStrategy: conflictResolution,
            rounds: consensusProcess.rounds
        }
    }

    private async simulateConsensusBuilding(proposal: any, participants: string[], deadline: Date, model: BaseChatModel): Promise<any> {
        // Simplified consensus simulation
        const votes = participants.map(participant => ({
            participant,
            vote: Math.random() > 0.3 ? 'approve' : 'reject', // 70% approval rate
            reasoning: `${participant} ${Math.random() > 0.3 ? 'agrees' : 'has concerns'} with the proposal`
        }))

        const approvalCount = votes.filter(v => v.vote === 'approve').length
        const consensusReached = approvalCount > participants.length * 0.6 // 60% threshold

        return {
            reached: consensusReached,
            consensus: consensusReached ? proposal : null,
            votes,
            rounds: 1
        }
    }

    private async resolveConflict(params: any, config: any): Promise<any> {
        const { conflict, parties, resolutionStrategy } = params
        const { conflictResolution, model } = config

        const strategy = resolutionStrategy || conflictResolution

        let resolution
        switch (strategy) {
            case 'majority':
                resolution = await this.majorityVoteResolution(conflict, parties, model)
                break
            case 'expert':
                resolution = await this.expertAuthorityResolution(conflict, parties, model)
                break
            case 'coordinator':
                resolution = await this.coordinatorOverrideResolution(conflict, parties, model)
                break
            case 'consensus':
                resolution = await this.consensusResolution(conflict, parties, model)
                break
            default:
                throw new Error(`Unknown conflict resolution strategy: ${strategy}`)
        }

        return {
            success: true,
            conflict,
            parties,
            strategy,
            resolution,
            timestamp: new Date().toISOString()
        }
    }

    private async majorityVoteResolution(conflict: any, parties: string[], model: BaseChatModel): Promise<any> {
        const resolutionPrompt = `Resolve this conflict using majority vote:

Conflict: ${JSON.stringify(conflict, null, 2)}
Parties: ${parties.join(', ')}

Determine the majority position and provide the resolution.`

        const response = await model.invoke([{
            role: 'user',
            content: resolutionPrompt
        }])

        return {
            method: 'majority_vote',
            decision: response.content,
            confidence: 0.7
        }
    }

    private async expertAuthorityResolution(conflict: any, parties: string[], model: BaseChatModel): Promise<any> {
        const resolutionPrompt = `Resolve this conflict by identifying the most qualified expert:

Conflict: ${JSON.stringify(conflict, null, 2)}
Parties: ${parties.join(', ')}

Identify which party has the most relevant expertise and defer to their judgment.`

        const response = await model.invoke([{
            role: 'user',
            content: resolutionPrompt
        }])

        return {
            method: 'expert_authority',
            decision: response.content,
            confidence: 0.8
        }
    }

    private async coordinatorOverrideResolution(conflict: any, parties: string[], model: BaseChatModel): Promise<any> {
        const resolutionPrompt = `As the coordinator, resolve this conflict with final authority:

Conflict: ${JSON.stringify(conflict, null, 2)}
Parties: ${parties.join(', ')}

Make the final decision to resolve this conflict.`

        const response = await model.invoke([{
            role: 'user',
            content: resolutionPrompt
        }])

        return {
            method: 'coordinator_override',
            decision: response.content,
            confidence: 0.9
        }
    }

    private async consensusResolution(conflict: any, parties: string[], model: BaseChatModel): Promise<any> {
        const resolutionPrompt = `Facilitate consensus resolution for this conflict:

Conflict: ${JSON.stringify(conflict, null, 2)}
Parties: ${parties.join(', ')}

Find a solution that all parties can accept, even if it's a compromise.`

        const response = await model.invoke([{
            role: 'user',
            content: resolutionPrompt
        }])

        return {
            method: 'consensus',
            decision: response.content,
            confidence: 0.6
        }
    }
}

module.exports = { nodeClass: CollaborativeAgent_Agents }