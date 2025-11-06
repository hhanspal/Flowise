import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class HubSpot_Integrations implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'HubSpot CRM'
        this.name = 'hubspot'
        this.version = 1.0
        this.type = 'HubSpot'
        this.icon = 'hubspot.svg'
        this.category = 'Integrations'
        this.description = 'Connect to HubSpot CRM for contact management, deal tracking, and lead management'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['hubspotApi']
        }
        this.inputs = [
            {
                label: 'Operation',
                name: 'operation',
                type: 'options',
                options: [
                    {
                        label: 'Contacts',
                        name: 'contacts'
                    },
                    {
                        label: 'Deals',
                        name: 'deals'
                    },
                    {
                        label: 'Companies',
                        name: 'companies'
                    }
                ]
            },
            // Contact Actions
            {
                label: 'Contact Actions',
                name: 'contactActions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Create Contact',
                        name: 'createContact'
                    },
                    {
                        label: 'Update Contact',
                        name: 'updateContact'
                    },
                    {
                        label: 'Get Contact',
                        name: 'getContact'
                    },
                    {
                        label: 'Search Contacts',
                        name: 'searchContacts'
                    },
                    {
                        label: 'Delete Contact',
                        name: 'deleteContact'
                    }
                ],
                show: {
                    operation: ['contacts']
                }
            },
            // Deal Actions
            {
                label: 'Deal Actions',
                name: 'dealActions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Create Deal',
                        name: 'createDeal'
                    },
                    {
                        label: 'Update Deal',
                        name: 'updateDeal'
                    },
                    {
                        label: 'Get Deal',
                        name: 'getDeal'
                    },
                    {
                        label: 'List Deals',
                        name: 'listDeals'
                    },
                    {
                        label: 'Update Deal Stage',
                        name: 'updateDealStage'
                    }
                ],
                show: {
                    operation: ['deals']
                }
            },
            // Company Actions
            {
                label: 'Company Actions',
                name: 'companyActions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Create Company',
                        name: 'createCompany'
                    },
                    {
                        label: 'Update Company',
                        name: 'updateCompany'
                    },
                    {
                        label: 'Get Company',
                        name: 'getCompany'
                    },
                    {
                        label: 'Search Companies',
                        name: 'searchCompanies'
                    }
                ],
                show: {
                    operation: ['companies']
                }
            },
            // Contact Data
            {
                label: 'Contact Data',
                name: 'contactData',
                type: 'json',
                placeholder: '{"email": "user@example.com", "firstname": "John", "lastname": "Doe", "company": "Acme Corp"}',
                show: {
                    contactActions: ['createContact', 'updateContact']
                }
            },
            // Contact ID
            {
                label: 'Contact ID',
                name: 'contactId',
                type: 'string',
                placeholder: 'HubSpot contact ID or email',
                show: {
                    contactActions: ['updateContact', 'getContact', 'deleteContact']
                }
            },
            // Deal Data
            {
                label: 'Deal Data',
                name: 'dealData',
                type: 'json',
                placeholder: '{"dealname": "New Opportunity", "amount": "10000", "closedate": "2024-12-31", "dealstage": "qualifiedtobuy"}',
                show: {
                    dealActions: ['createDeal', 'updateDeal']
                }
            },
            // Deal ID
            {
                label: 'Deal ID',
                name: 'dealId',
                type: 'string',
                placeholder: 'HubSpot deal ID',
                show: {
                    dealActions: ['updateDeal', 'getDeal', 'updateDealStage']
                }
            },
            // Deal Stage
            {
                label: 'Deal Stage',
                name: 'dealStage',
                type: 'options',
                options: [
                    { label: 'Appointment Scheduled', name: 'appointmentscheduled' },
                    { label: 'Qualified to Buy', name: 'qualifiedtobuy' },
                    { label: 'Presentation Scheduled', name: 'presentationscheduled' },
                    { label: 'Decision Maker Bought In', name: 'decisionmakerboughtin' },
                    { label: 'Contract Sent', name: 'contractsent' },
                    { label: 'Closed Won', name: 'closedwon' },
                    { label: 'Closed Lost', name: 'closedlost' }
                ],
                show: {
                    dealActions: ['updateDealStage']
                }
            },
            // Company Data
            {
                label: 'Company Data',
                name: 'companyData',
                type: 'json',
                placeholder: '{"name": "Acme Corp", "domain": "acme.com", "industry": "Technology"}',
                show: {
                    companyActions: ['createCompany', 'updateCompany']
                }
            },
            // Company ID
            {
                label: 'Company ID',
                name: 'companyId',
                type: 'string',
                placeholder: 'HubSpot company ID',
                show: {
                    companyActions: ['updateCompany', 'getCompany']
                }
            },
            // Search Query
            {
                label: 'Search Query',
                name: 'searchQuery',
                type: 'string',
                placeholder: 'Search term or email',
                show: {
                    contactActions: ['searchContacts'],
                    companyActions: ['searchCompanies']
                }
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', nodeData)
        const apiKey = getCredentialParam('apiKey', credentialData, nodeData)

        const operation = nodeData.inputs?.operation as string
        const contactActions = convertMultiOptionsToStringArray(nodeData.inputs?.contactActions)
        const dealActions = convertMultiOptionsToStringArray(nodeData.inputs?.dealActions)
        const companyActions = convertMultiOptionsToStringArray(nodeData.inputs?.companyActions)

        return {
            apiKey,
            operation,
            contactActions,
            dealActions,
            companyActions,
            contactData: nodeData.inputs?.contactData,
            contactId: nodeData.inputs?.contactId,
            dealData: nodeData.inputs?.dealData,
            dealId: nodeData.inputs?.dealId,
            dealStage: nodeData.inputs?.dealStage,
            companyData: nodeData.inputs?.companyData,
            companyId: nodeData.inputs?.companyId,
            searchQuery: nodeData.inputs?.searchQuery
        }
    }

    async run(nodeData: INodeData): Promise<string | object> {
        const input = await this.init(nodeData)

        const tools = await this.createHubSpotTools(input)
        return tools
    }

    private async createHubSpotTools(input: any): Promise<any[]> {
        const tools = []

        const { operation, contactActions, dealActions, companyActions } = input

        if (operation === 'contacts' && contactActions) {
            for (const action of contactActions) {
                tools.push(await this.createContactTool(action, input))
            }
        }

        if (operation === 'deals' && dealActions) {
            for (const action of dealActions) {
                tools.push(await this.createDealTool(action, input))
            }
        }

        if (operation === 'companies' && companyActions) {
            for (const action of companyActions) {
                tools.push(await this.createCompanyTool(action, input))
            }
        }

        return tools
    }

    private async createContactTool(action: string, input: any): Promise<any> {
        const { apiKey, contactData, contactId, searchQuery } = input

        switch (action) {
            case 'createContact':
                return {
                    name: 'create_hubspot_contact',
                    description: 'Create a new contact in HubSpot CRM',
                    schema: {
                        type: 'object',
                        properties: {
                            contactData: {
                                type: 'object',
                                description: 'Contact information including email, name, company, etc.'
                            }
                        },
                        required: ['contactData']
                    },
                    func: async (params: any) => {
                        const data = params.contactData || contactData
                        return await this.createContact(apiKey, data)
                    }
                }

            case 'updateContact':
                return {
                    name: 'update_hubspot_contact',
                    description: 'Update an existing contact in HubSpot CRM',
                    schema: {
                        type: 'object',
                        properties: {
                            contactId: { type: 'string', description: 'HubSpot contact ID' },
                            contactData: { type: 'object', description: 'Updated contact information' }
                        },
                        required: ['contactId', 'contactData']
                    },
                    func: async (params: any) => {
                        const id = params.contactId || contactId
                        const data = params.contactData || contactData
                        return await this.updateContact(apiKey, id, data)
                    }
                }

            case 'getContact':
                return {
                    name: 'get_hubspot_contact',
                    description: 'Retrieve a contact from HubSpot CRM',
                    schema: {
                        type: 'object',
                        properties: {
                            contactId: { type: 'string', description: 'HubSpot contact ID or email' }
                        },
                        required: ['contactId']
                    },
                    func: async (params: any) => {
                        const id = params.contactId || contactId
                        return await this.getContact(apiKey, id)
                    }
                }

            case 'searchContacts':
                return {
                    name: 'search_hubspot_contacts',
                    description: 'Search for contacts in HubSpot CRM',
                    schema: {
                        type: 'object',
                        properties: {
                            query: { type: 'string', description: 'Search query (email, name, company)' }
                        },
                        required: ['query']
                    },
                    func: async (params: any) => {
                        const query = params.query || searchQuery
                        return await this.searchContacts(apiKey, query)
                    }
                }

            default:
                throw new Error(`Unknown contact action: ${action}`)
        }
    }

    private async createDealTool(action: string, input: any): Promise<any> {
        const { apiKey, dealData, dealId, dealStage } = input

        switch (action) {
            case 'createDeal':
                return {
                    name: 'create_hubspot_deal',
                    description: 'Create a new deal in HubSpot CRM',
                    schema: {
                        type: 'object',
                        properties: {
                            dealData: {
                                type: 'object',
                                description: 'Deal information including name, amount, stage, etc.'
                            }
                        },
                        required: ['dealData']
                    },
                    func: async (params: any) => {
                        const data = params.dealData || dealData
                        return await this.createDeal(apiKey, data)
                    }
                }

            case 'updateDealStage':
                return {
                    name: 'update_hubspot_deal_stage',
                    description: 'Update the stage of a deal in HubSpot CRM',
                    schema: {
                        type: 'object',
                        properties: {
                            dealId: { type: 'string', description: 'HubSpot deal ID' },
                            stage: { type: 'string', description: 'New deal stage' }
                        },
                        required: ['dealId', 'stage']
                    },
                    func: async (params: any) => {
                        const id = params.dealId || dealId
                        const stage = params.stage || dealStage
                        return await this.updateDealStage(apiKey, id, stage)
                    }
                }

            default:
                throw new Error(`Unknown deal action: ${action}`)
        }
    }

    private async createCompanyTool(action: string, input: any): Promise<any> {
        const { apiKey, companyData, companyId, searchQuery } = input

        switch (action) {
            case 'createCompany':
                return {
                    name: 'create_hubspot_company',
                    description: 'Create a new company in HubSpot CRM',
                    schema: {
                        type: 'object',
                        properties: {
                            companyData: {
                                type: 'object',
                                description: 'Company information including name, domain, industry, etc.'
                            }
                        },
                        required: ['companyData']
                    },
                    func: async (params: any) => {
                        const data = params.companyData || companyData
                        return await this.createCompany(apiKey, data)
                    }
                }

            default:
                throw new Error(`Unknown company action: ${action}`)
        }
    }

    // HubSpot API methods
    private async createContact(apiKey: string, contactData: any): Promise<any> {
        const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ properties: contactData })
        })

        if (!response.ok) {
            throw new Error(`HubSpot API error: ${response.status}`)
        }

        return await response.json()
    }

    private async updateContact(apiKey: string, contactId: string, contactData: any): Promise<any> {
        const response = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ properties: contactData })
        })

        if (!response.ok) {
            throw new Error(`HubSpot API error: ${response.status}`)
        }

        return await response.json()
    }

    private async getContact(apiKey: string, contactId: string): Promise<any> {
        const url = contactId.includes('@')
            ? `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?idProperty=email`
            : `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        })

        if (!response.ok) {
            throw new Error(`HubSpot API error: ${response.status}`)
        }

        return await response.json()
    }

    private async searchContacts(apiKey: string, query: string): Promise<any> {
        const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filterGroups: [{
                    filters: [{
                        propertyName: 'email',
                        operator: 'CONTAINS_TOKEN',
                        value: query
                    }]
                }],
                limit: 10
            })
        })

        if (!response.ok) {
            throw new Error(`HubSpot API error: ${response.status}`)
        }

        return await response.json()
    }

    private async createDeal(apiKey: string, dealData: any): Promise<any> {
        const response = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ properties: dealData })
        })

        if (!response.ok) {
            throw new Error(`HubSpot API error: ${response.status}`)
        }

        return await response.json()
    }

    private async updateDealStage(apiKey: string, dealId: string, stage: string): Promise<any> {
        const response = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${dealId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                properties: { dealstage: stage }
            })
        })

        if (!response.ok) {
            throw new Error(`HubSpot API error: ${response.status}`)
        }

        return await response.json()
    }

    private async createCompany(apiKey: string, companyData: any): Promise<any> {
        const response = await fetch('https://api.hubapi.com/crm/v3/objects/companies', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ properties: companyData })
        })

        if (!response.ok) {
            throw new Error(`HubSpot API error: ${response.status}`)
        }

        return await response.json()
    }
}

module.exports = { nodeClass: HubSpot_Integrations }