#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { program } = require('commander')

program
  .name('agentflowos-migrator')
  .description('Migrate AgentFlowOS workflows to Flowise format')
  .version('1.0.0')

program
  .command('migrate')
  .description('Migrate AgentFlowOS workflow files to Flowise format')
  .argument('<source>', 'Source directory containing AgentFlowOS workflows')
  .argument('<destination>', 'Destination directory for Flowise workflows')
  .option('-f, --force', 'Overwrite existing files')
  .option('-v, --verbose', 'Verbose output')
  .action(async (source, destination, options) => {
    try {
      console.log('🚀 Starting AgentFlowOS to Flowise migration...')
      console.log(`📁 Source: ${source}`)
      console.log(`📁 Destination: ${destination}`)

      // Ensure destination directory exists
      if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true })
        console.log('📁 Created destination directory')
      }

      // Find all workflow files
      const workflowFiles = findWorkflowFiles(source)
      console.log(`📋 Found ${workflowFiles.length} workflow files`)

      let successCount = 0
      let errorCount = 0

      for (const filePath of workflowFiles) {
        try {
          const migrated = await migrateWorkflow(filePath, destination, options)
          if (migrated) {
            successCount++
            if (options.verbose) {
              console.log(`✅ Migrated: ${path.relative(source, filePath)}`)
            }
          }
        } catch (error) {
          errorCount++
          console.error(`❌ Failed to migrate ${path.relative(source, filePath)}: ${error.message}`)
        }
      }

      console.log(`\n🎉 Migration complete!`)
      console.log(`✅ Successfully migrated: ${successCount} workflows`)
      if (errorCount > 0) {
        console.log(`❌ Failed migrations: ${errorCount} workflows`)
      }

    } catch (error) {
      console.error('💥 Migration failed:', error.message)
      process.exit(1)
    }
  })

program
  .command('validate')
  .description('Validate AgentFlowOS workflow files')
  .argument('<source>', 'Source directory containing AgentFlowOS workflows')
  .action(async (source) => {
    try {
      console.log('🔍 Validating AgentFlowOS workflows...')
      console.log(`📁 Source: ${source}`)

      const workflowFiles = findWorkflowFiles(source)
      console.log(`📋 Found ${workflowFiles.length} workflow files`)

      let validCount = 0
      let invalidCount = 0

      for (const filePath of workflowFiles) {
        try {
          const isValid = validateWorkflow(filePath)
          if (isValid) {
            validCount++
            console.log(`✅ Valid: ${path.relative(source, filePath)}`)
          } else {
            invalidCount++
            console.log(`❌ Invalid: ${path.relative(source, filePath)}`)
          }
        } catch (error) {
          invalidCount++
          console.error(`💥 Error validating ${path.relative(source, filePath)}: ${error.message}`)
        }
      }

      console.log(`\n📊 Validation results:`)
      console.log(`✅ Valid workflows: ${validCount}`)
      console.log(`❌ Invalid workflows: ${invalidCount}`)

    } catch (error) {
      console.error('💥 Validation failed:', error.message)
      process.exit(1)
    }
  })

program
  .command('analyze')
  .description('Analyze AgentFlowOS workflows for migration compatibility')
  .argument('<source>', 'Source directory containing AgentFlowOS workflows')
  .action(async (source) => {
    try {
      console.log('📊 Analyzing AgentFlowOS workflows...')
      console.log(`📁 Source: ${source}`)

      const workflowFiles = findWorkflowFiles(source)
      console.log(`📋 Found ${workflowFiles.length} workflow files`)

      const analysis = {
        totalWorkflows: workflowFiles.length,
        agentTypes: new Map(),
        integrationTypes: new Map(),
        complexity: { simple: 0, medium: 0, complex: 0 },
        migrationIssues: []
      }

      for (const filePath of workflowFiles) {
        try {
          const workflowAnalysis = analyzeWorkflow(filePath)

          // Count agent types
          workflowAnalysis.agents.forEach(agent => {
            analysis.agentTypes.set(agent.type, (analysis.agentTypes.get(agent.type) || 0) + 1)
          })

          // Count integration types
          workflowAnalysis.integrations.forEach(integration => {
            analysis.integrationTypes.set(integration.type, (analysis.integrationTypes.get(integration.type) || 0) + 1)
          })

          // Assess complexity
          if (workflowAnalysis.nodeCount <= 5) {
            analysis.complexity.simple++
          } else if (workflowAnalysis.nodeCount <= 15) {
            analysis.complexity.medium++
          } else {
            analysis.complexity.complex++
          }

          // Collect migration issues
          analysis.migrationIssues.push(...workflowAnalysis.issues)

        } catch (error) {
          console.error(`💥 Error analyzing ${path.relative(source, filePath)}: ${error.message}`)
        }
      }

      console.log('\n📊 Analysis Results:')
      console.log(`Total workflows: ${analysis.totalWorkflows}`)
      console.log('\n🤖 Agent Types:')
      for (const [type, count] of analysis.agentTypes) {
        console.log(`  ${type}: ${count}`)
      }
      console.log('\n🔗 Integration Types:')
      for (const [type, count] of analysis.integrationTypes) {
        console.log(`  ${type}: ${count}`)
      }
      console.log('\n📈 Complexity Distribution:')
      console.log(`  Simple (≤5 nodes): ${analysis.complexity.simple}`)
      console.log(`  Medium (6-15 nodes): ${analysis.complexity.medium}`)
      console.log(`  Complex (≥16 nodes): ${analysis.complexity.complex}`)

      if (analysis.migrationIssues.length > 0) {
        console.log('\n⚠️  Migration Issues:')
        analysis.migrationIssues.forEach(issue => {
          console.log(`  • ${issue}`)
        })
      }

    } catch (error) {
      console.error('💥 Analysis failed:', error.message)
      process.exit(1)
    }
  })

function findWorkflowFiles(sourceDir) {
  const workflowFiles = []

  function scanDirectory(dir) {
    const items = fs.readdirSync(dir)

    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        // Skip common non-workflow directories
        if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
          scanDirectory(fullPath)
        }
      } else if (stat.isFile()) {
        // Check for workflow file extensions
        const ext = path.extname(item).toLowerCase()
        if (['.json', '.yaml', '.yml', '.js', '.ts'].includes(ext)) {
          // Check if it's a workflow file by reading first few lines
          if (isWorkflowFile(fullPath)) {
            workflowFiles.push(fullPath)
          }
        }
      }
    }
  }

  scanDirectory(sourceDir)
  return workflowFiles
}

function isWorkflowFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')

    // Check for AgentFlowOS workflow indicators
    const indicators = [
      'agentflowos',
      'workflow',
      'agents',
      'integrations',
      'nodes',
      'connections'
    ]

    const lowerContent = content.toLowerCase()
    return indicators.some(indicator => lowerContent.includes(indicator))
  } catch (error) {
    return false
  }
}

async function migrateWorkflow(sourcePath, destinationDir, options) {
  const content = fs.readFileSync(sourcePath, 'utf8')
  let workflow

  try {
    // Try parsing as JSON first
    if (path.extname(sourcePath).toLowerCase() === '.json') {
      workflow = JSON.parse(content)
    } else {
      // For other formats, we'd need additional parsing logic
      console.warn(`⚠️  Skipping non-JSON workflow: ${sourcePath}`)
      return false
    }
  } catch (error) {
    throw new Error(`Failed to parse workflow file: ${error.message}`)
  }

  // Convert AgentFlowOS workflow to Flowise format
  const flowiseWorkflow = convertToFlowiseFormat(workflow)

  // Generate destination filename
  const relativePath = path.relative(path.dirname(sourcePath), sourcePath)
  const destPath = path.join(destinationDir, relativePath.replace(/\.[^/.]+$/, '.json'))

  // Ensure destination directory exists
  const destDir = path.dirname(destPath)
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }

  // Check if destination file exists
  if (fs.existsSync(destPath) && !options.force) {
    throw new Error(`Destination file already exists: ${destPath} (use --force to overwrite)`)
  }

  // Write migrated workflow
  fs.writeFileSync(destPath, JSON.stringify(flowiseWorkflow, null, 2))

  return true
}

function convertToFlowiseFormat(agentflowosWorkflow) {
  const flowiseWorkflow = {
    id: generateId(),
    name: agentflowosWorkflow.name || 'Migrated Workflow',
    description: agentflowosWorkflow.description || '',
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  // Convert agents to Flowise nodes
  if (agentflowosWorkflow.agents) {
    agentflowosWorkflow.agents.forEach((agent, index) => {
      const node = convertAgentToNode(agent, index)
      flowiseWorkflow.nodes.push(node)
    })
  }

  // Convert integrations to Flowise nodes
  if (agentflowosWorkflow.integrations) {
    agentflowosWorkflow.integrations.forEach((integration, index) => {
      const node = convertIntegrationToNode(integration, index + (agentflowosWorkflow.agents?.length || 0))
      flowiseWorkflow.nodes.push(node)
    })
  }

  // Convert connections to edges
  if (agentflowosWorkflow.connections) {
    agentflowosWorkflow.connections.forEach((connection, index) => {
      const edge = convertConnectionToEdge(connection, index)
      flowiseWorkflow.edges.push(edge)
    })
  }

  return flowiseWorkflow
}

function convertAgentToNode(agent, index) {
  const nodeTypes = {
    'customer-support': 'CustomerSupportAgent',
    'sales': 'SalesAgent',
    'data-analysis': 'DataAnalysisAgent'
  }

  const nodeType = nodeTypes[agent.type] || 'CustomAgent'

  return {
    id: agent.id || generateId(),
    type: nodeType,
    position: { x: index * 300, y: 100 },
    data: {
      name: agent.name,
      description: agent.description,
      configuration: agent.configuration || {},
      inputs: agent.inputs || [],
      outputs: agent.outputs || []
    }
  }
}

function convertIntegrationToNode(integration, index) {
  const nodeTypes = {
    'hubspot': 'HubSpot',
    'express': 'ExpressAdapter',
    'nextjs': 'NextjsAdapter'
  }

  const nodeType = nodeTypes[integration.type] || 'CustomIntegration'

  return {
    id: integration.id || generateId(),
    type: nodeType,
    position: { x: index * 300, y: 300 },
    data: {
      name: integration.name,
      configuration: integration.configuration || {},
      credentials: integration.credentials || {}
    }
  }
}

function convertConnectionToEdge(connection, index) {
  return {
    id: generateId(),
    source: connection.from,
    target: connection.to,
    sourceHandle: connection.output || 'output',
    targetHandle: connection.input || 'input',
    type: 'default'
  }
}

function validateWorkflow(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const workflow = JSON.parse(content)

    // Basic validation checks
    const requiredFields = ['name', 'agents', 'integrations']
    for (const field of requiredFields) {
      if (!workflow[field]) {
        return false
      }
    }

    // Validate agents have required fields
    if (workflow.agents && Array.isArray(workflow.agents)) {
      for (const agent of workflow.agents) {
        if (!agent.type || !agent.name) {
          return false
        }
      }
    }

    // Validate integrations have required fields
    if (workflow.integrations && Array.isArray(workflow.integrations)) {
      for (const integration of workflow.integrations) {
        if (!integration.type || !integration.name) {
          return false
        }
      }
    }

    return true
  } catch (error) {
    return false
  }
}

function analyzeWorkflow(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const workflow = JSON.parse(content)

  const analysis = {
    agents: [],
    integrations: [],
    nodeCount: 0,
    issues: []
  }

  // Analyze agents
  if (workflow.agents && Array.isArray(workflow.agents)) {
    analysis.agents = workflow.agents.map(agent => ({
      type: agent.type,
      name: agent.name
    }))
  }

  // Analyze integrations
  if (workflow.integrations && Array.isArray(workflow.integrations)) {
    analysis.integrations = workflow.integrations.map(integration => ({
      type: integration.type,
      name: integration.name
    }))
  }

  // Calculate total nodes
  analysis.nodeCount = analysis.agents.length + analysis.integrations.length

  // Identify potential migration issues
  if (workflow.customCode) {
    analysis.issues.push('Contains custom code that may need manual conversion')
  }

  if (workflow.externalDependencies) {
    analysis.issues.push('Has external dependencies that need to be verified in Flowise')
  }

  const unsupportedAgentTypes = ['custom', 'legacy']
  analysis.agents.forEach(agent => {
    if (unsupportedAgentTypes.includes(agent.type)) {
      analysis.issues.push(`Agent type '${agent.type}' may not have direct Flowise equivalent`)
    }
  })

  return analysis
}

function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

program.parse()