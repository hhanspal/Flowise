// Simple validation script to check migration syntax
import { AddAgentFlowOSMarketplaceTables20251104100959 as PostgresMigration } from './postgres/20251104100959-AddAgentFlowOSMarketplaceTables'
import { AddAgentFlowOSMarketplaceTables20251104100959 as SqliteMigration } from './sqlite/20251104100959-AddAgentFlowOSMarketplaceTables'
import { AddAgentFlowOSMarketplaceTables20251104100959 as MysqlMigration } from './mysql/20251104100959-AddAgentFlowOSMarketplaceTables'
import { AddAgentFlowOSMarketplaceTables20251104100959 as MariadbMigration } from './mariadb/20251104100959-AddAgentFlowOSMarketplaceTables'

// Validate that migration classes have the required interface
const validateMigration = (migration: any, name: string) => {
    if (!migration.name) {
        throw new Error(`${name} migration missing name property`)
    }
    if (typeof migration.up !== 'function') {
        throw new Error(`${name} migration missing up method`)
    }
    if (typeof migration.down !== 'function') {
        throw new Error(`${name} migration missing down method`)
    }
    console.log(`✓ ${name} migration validated successfully`)
}

try {
    validateMigration(PostgresMigration, 'Postgres')
    validateMigration(SqliteMigration, 'SQLite')
    validateMigration(MysqlMigration, 'MySQL')
    validateMigration(MariadbMigration, 'MariaDB')
    console.log('✓ All AgentFlowOS marketplace migrations validated successfully!')
} catch (error) {
    console.error('✗ Migration validation failed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
}