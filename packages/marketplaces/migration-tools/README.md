# AgentFlowOS to Flowise Migration Tools

This package provides tools to migrate existing AgentFlowOS workflows to Flowise format, enabling seamless transition to AgentFlowOS Studio.

## Installation

```bash
npm install -g @flowise/migration-tools
# or
yarn global add @flowise/migration-tools
```

## Usage

### Migrate Workflows

Convert AgentFlowOS workflow files to Flowise format:

```bash
agentflowos-migrator migrate <source-directory> <destination-directory> [options]
```

**Example:**
```bash
agentflowos-migrator migrate ./my-agentflowos-workflows ./migrated-flowise-workflows --verbose
```

**Options:**
- `-f, --force`: Overwrite existing files
- `-v, --verbose`: Show detailed output

### Validate Workflows

Check if AgentFlowOS workflow files are valid and ready for migration:

```bash
agentflowos-migrator validate <source-directory>
```

**Example:**
```bash
agentflowos-migrator validate ./my-workflows
```

### Analyze Workflows

Get detailed analysis of workflows for migration planning:

```bash
agentflowos-migrator analyze <source-directory>
```

**Example:**
```bash
agentflowos-migrator analyze ./my-workflows
```

## Supported Workflow Formats

The migration tool supports:
- JSON workflow files (`.json`)
- YAML workflow files (`.yaml`, `.yml`) - *planned*
- JavaScript/TypeScript workflow files (`.js`, `.ts`) - *planned*

## Migration Process

### What Gets Migrated

1. **Agents**: Converted to corresponding Flowise agent nodes
   - Customer Support Agent → `CustomerSupportAgent` node
   - Sales Agent → `SalesAgent` node
   - Data Analysis Agent → `DataAnalysisAgent` node

2. **Integrations**: Converted to Flowise integration nodes
   - HubSpot → `HubSpot` node
   - Express.js → `ExpressAdapter` node
   - Next.js → `NextjsAdapter` node

3. **Connections**: Converted to Flowise edges with proper handle mapping

4. **Configuration**: Preserved and adapted to Flowise node format

### Migration Limitations

- Custom code components may need manual review
- External dependencies must be verified for Flowise compatibility
- Some advanced AgentFlowOS features may require Flowise equivalents

## Workflow Analysis

The analysis command provides insights into:

- **Agent Types**: Distribution of agent types in your workflows
- **Integration Types**: Types of integrations being used
- **Complexity**: Simple/Medium/Complex workflow classification
- **Migration Issues**: Potential problems that need attention

## Examples

### Basic Migration

```bash
# Migrate all workflows from a directory
agentflowos-migrator migrate ./workflows ./flowise-workflows

# Force overwrite existing files
agentflowos-migrator migrate ./workflows ./flowise-workflows --force

# Verbose output
agentflowos-migrator migrate ./workflows ./flowise-workflows --verbose
```

### Validation and Analysis

```bash
# Validate workflow files
agentflowos-migrator validate ./workflows

# Analyze workflow complexity and compatibility
agentflowos-migrator analyze ./workflows
```

### Batch Processing

```bash
# Process multiple directories
for dir in ./project1 ./project2 ./project3; do
  agentflowos-migrator migrate "$dir/workflows" "$dir/flowise-workflows" --verbose
done
```

## Troubleshooting

### Common Issues

1. **"Destination file already exists"**
   - Use `--force` flag to overwrite existing files

2. **"Failed to parse workflow file"**
   - Ensure workflow files are valid JSON
   - Check file encoding (should be UTF-8)

3. **"No workflow files found"**
   - Verify the source directory contains workflow files
   - Check file extensions (.json, .yaml, .yml, .js, .ts)

4. **Migration warnings**
   - Review analysis output for potential issues
   - Some features may need manual conversion

### Getting Help

- Check the [AgentFlowOS documentation](https://docs.agentflowos.com)
- Review Flowise [node documentation](https://docs.flowiseai.com)
- File issues on the [AgentFlowOS GitHub repository](https://github.com/your-org/AgentFlowOS)

## API Reference

### Migration Algorithm

The migration process follows these steps:

1. **Discovery**: Find all workflow files in source directory
2. **Validation**: Verify workflow file integrity
3. **Conversion**: Transform AgentFlowOS format to Flowise format
4. **Optimization**: Clean up and optimize the converted workflow
5. **Output**: Write migrated workflows to destination directory

### Node Mapping

| AgentFlowOS Component | Flowise Node |
|----------------------|--------------|
| CustomerSupportAgent | CustomerSupportAgent |
| SalesAgent | SalesAgent |
| DataAnalysisAgent | DataAnalysisAgent |
| HubSpot Integration | HubSpot |
| Express.js Adapter | ExpressAdapter |
| Next.js Adapter | NextjsAdapter |

## Contributing

Contributions are welcome! Please see the main AgentFlowOS repository for contribution guidelines.

## License

MIT License - see LICENSE file for details.