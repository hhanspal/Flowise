const { CustomerSupportAgent } = require('../components/nodes/agents/CustomerSupportAgent/CustomerSupportAgent')
const { SalesAgent } = require('../components/nodes/agents/SalesAgent/SalesAgent')
const { DataAnalysisAgent } = require('../components/nodes/agents/DataAnalysisAgent/DataAnalysisAgent')
const { HubSpot } = require('../components/nodes/integrations/HubSpot/HubSpot')
const { ExpressAdapter } = require('../components/nodes/integrations/ExpressAdapter/ExpressAdapter')
const { NextjsAdapter } = require('../components/nodes/integrations/NextjsAdapter/NextjsAdapter')

describe('AgentFlowOS Integration Tests', () => {
  describe('Agent Nodes', () => {
    test('CustomerSupportAgent should initialize correctly', () => {
      const node = new CustomerSupportAgent_Integrations()

      expect(node.label).toBe('Customer Support Agent')
      expect(node.name).toBe('customerSupportAgent')
      expect(node.category).toBe('Agents')
      expect(node.baseClasses).toContain('CustomerSupportAgent')
      expect(node.inputs).toBeDefined()
    })

    test('SalesAgent should initialize correctly', () => {
      const node = new SalesAgent_Integrations()

      expect(node.label).toBe('Sales Agent')
      expect(node.name).toBe('salesAgent')
      expect(node.category).toBe('Agents')
      expect(node.baseClasses).toContain('SalesAgent')
      expect(node.inputs).toBeDefined()
    })

    test('DataAnalysisAgent should initialize correctly', () => {
      const node = new DataAnalysisAgent_Integrations()

      expect(node.label).toBe('Data Analysis Agent')
      expect(node.name).toBe('dataAnalysisAgent')
      expect(node.category).toBe('Agents')
      expect(node.baseClasses).toContain('DataAnalysisAgent')
      expect(node.inputs).toBeDefined()
    })
  })

  describe('Integration Nodes', () => {
    test('HubSpot should initialize correctly', () => {
      const node = new HubSpot_Integrations()

      expect(node.label).toBe('HubSpot CRM')
      expect(node.name).toBe('hubSpot')
      expect(node.category).toBe('Integrations')
      expect(node.baseClasses).toContain('HubSpot')
      expect(node.inputs).toBeDefined()
    })

    test('ExpressAdapter should initialize correctly', () => {
      const node = new ExpressAdapter_Integrations()

      expect(node.label).toBe('Express.js Adapter')
      expect(node.name).toBe('expressAdapter')
      expect(node.category).toBe('Integrations')
      expect(node.baseClasses).toContain('ExpressAdapter')
      expect(node.inputs).toBeDefined()
    })

    test('NextjsAdapter should initialize correctly', () => {
      const node = new NextjsAdapter_Integrations()

      expect(node.label).toBe('Next.js Adapter')
      expect(node.name).toBe('nextjsAdapter')
      expect(node.category).toBe('Integrations')
      expect(node.baseClasses).toContain('NextjsAdapter')
      expect(node.inputs).toBeDefined()
    })
  })

  describe('Node Functionality', () => {
    test('CustomerSupportAgent should process customer queries', async () => {
      const node = new CustomerSupportAgent_Integrations()
      const nodeData = {
        inputs: {
          supportType: 'general',
          knowledgeBase: 'sample knowledge',
          responseStyle: 'helpful'
        }
      }

      const result = await node.init(nodeData)
      expect(result).toBeDefined()
      expect(result.supportType).toBe('general')
    })

    test('SalesAgent should handle sales interactions', async () => {
      const node = new SalesAgent_Integrations()
      const nodeData = {
        inputs: {
          salesStrategy: 'consultative',
          productKnowledge: 'sample products',
          targetAudience: 'small business'
        }
      }

      const result = await node.init(nodeData)
      expect(result).toBeDefined()
      expect(result.salesStrategy).toBe('consultative')
    })

    test('HubSpot should configure CRM integration', async () => {
      const node = new HubSpot_Integrations()
      const nodeData = {
        inputs: {
          operation: 'getContacts',
          apiKey: 'test-key',
          properties: ['firstname', 'lastname', 'email']
        }
      }

      const result = await node.init(nodeData)
      expect(result).toBeDefined()
      expect(result.operation).toBe('getContacts')
    })

    test('ExpressAdapter should generate API routes', async () => {
      const node = new ExpressAdapter_Integrations()
      const nodeData = {
        inputs: {
          routeType: 'agents',
          basePath: '/api/test',
          enableCors: true,
          enableAuth: false
        }
      }

      const result = await node.init(nodeData)
      expect(result).toBeDefined()
      expect(result.routeType).toBe('agents')
      expect(result.basePath).toBe('/api/test')
    })
  })

  describe('Workflow Templates', () => {
    const fs = require('fs')
    const path = require('path')

    const templateDir = path.join(__dirname, '../chatflows')

    test('Customer Support Automation template should exist', () => {
      const templatePath = path.join(templateDir, 'Customer Support Automation.json')
      expect(fs.existsSync(templatePath)).toBe(true)

      const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'))
      expect(template.name).toContain('Customer Support')
      expect(template.nodes).toBeDefined()
      expect(Array.isArray(template.nodes)).toBe(true)
    })

    test('Sales Automation Pipeline template should exist', () => {
      const templatePath = path.join(templateDir, 'Sales Automation Pipeline.json')
      expect(fs.existsSync(templatePath)).toBe(true)

      const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'))
      expect(template.name).toContain('Sales')
      expect(template.nodes).toBeDefined()
      expect(Array.isArray(template.nodes)).toBe(true)
    })

    test('DevOps CI-CD Automation template should exist', () => {
      const templatePath = path.join(templateDir, 'DevOps CI-CD Automation.json')
      expect(fs.existsSync(templatePath)).toBe(true)

      const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'))
      expect(template.name).toContain('DevOps')
      expect(template.nodes).toBeDefined()
      expect(Array.isArray(template.nodes)).toBe(true)
    })

    test('Business Intelligence Dashboard template should exist', () => {
      const templatePath = path.join(templateDir, 'Business Intelligence Dashboard.json')
      expect(fs.existsSync(templatePath)).toBe(true)

      const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'))
      expect(template.name).toContain('Business Intelligence')
      expect(template.nodes).toBeDefined()
      expect(Array.isArray(template.nodes)).toBe(true)
    })
  })

  describe('Marketplace Structure', () => {
    const fs = require('fs')
    const path = require('path')

    const marketplaceDir = path.join(__dirname, '..')

    test('Marketplace directories should exist', () => {
      expect(fs.existsSync(path.join(marketplaceDir, 'chatflows'))).toBe(true)
      expect(fs.existsSync(path.join(marketplaceDir, 'tools'))).toBe(true)
      expect(fs.existsSync(path.join(marketplaceDir, 'agentflowsv2'))).toBe(true)
    })

    test('Migration tools should be available', () => {
      const migrationDir = path.join(marketplaceDir, 'migration-tools')
      expect(fs.existsSync(migrationDir)).toBe(true)
      expect(fs.existsSync(path.join(migrationDir, 'migrate-workflows.js'))).toBe(true)
      expect(fs.existsSync(path.join(migrationDir, 'package.json'))).toBe(true)
      expect(fs.existsSync(path.join(migrationDir, 'README.md'))).toBe(true)
    })
  })
})