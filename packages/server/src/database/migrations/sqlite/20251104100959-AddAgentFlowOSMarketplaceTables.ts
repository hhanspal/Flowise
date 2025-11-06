import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAgentFlowOSMarketplaceTables20251104100959 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add workspaceId to existing custom_template table if not exists
        await queryRunner.query(`
            ALTER TABLE custom_template ADD COLUMN workspaceId TEXT NOT NULL DEFAULT ''
        `).catch(() => {
            // Column might already exist, ignore error
        })

        // Create marketplace_submissions table for community submissions
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS marketplace_submissions (
                id TEXT PRIMARY KEY,
                templateId TEXT NOT NULL,
                submitterId TEXT NOT NULL,
                submitterName TEXT NOT NULL,
                submitterEmail TEXT,
                category TEXT NOT NULL,
                tags TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                reviewNotes TEXT,
                reviewedBy TEXT,
                reviewedAt DATETIME,
                downloadCount INTEGER NOT NULL DEFAULT 0,
                rating DECIMAL(3,2),
                reviewCount INTEGER NOT NULL DEFAULT 0,
                featured BOOLEAN NOT NULL DEFAULT 0,
                workspaceId TEXT NOT NULL,
                createdDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `)

        // Create agent_experiences table for agent learning and adaptation
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS agent_experiences (
                id TEXT PRIMARY KEY,
                agentId TEXT NOT NULL,
                agentType TEXT NOT NULL,
                workflowId TEXT,
                executionId TEXT,
                inputData TEXT,
                outputData TEXT,
                performance TEXT,
                success BOOLEAN NOT NULL,
                errorMessage TEXT,
                executionTime INTEGER,
                tokenUsage INTEGER,
                cost DECIMAL(10,6),
                lessonsLearned TEXT,
                adaptations TEXT,
                confidence DECIMAL(3,2),
                feedback TEXT,
                workspaceId TEXT NOT NULL,
                createdDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `)

        // Create workflow_templates table for enhanced template management
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS workflow_templates (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                category TEXT NOT NULL,
                tags TEXT,
                framework TEXT,
                usecases TEXT,
                complexity TEXT DEFAULT 'beginner',
                estimatedTime INTEGER,
                prerequisites TEXT,
                flowData TEXT NOT NULL,
                thumbnail TEXT,
                screenshots TEXT,
                author TEXT,
                authorId TEXT,
                version TEXT DEFAULT '1.0.0',
                isPublic BOOLEAN NOT NULL DEFAULT 0,
                isOfficial BOOLEAN NOT NULL DEFAULT 0,
                downloadCount INTEGER NOT NULL DEFAULT 0,
                rating DECIMAL(3,2),
                reviewCount INTEGER NOT NULL DEFAULT 0,
                lastUpdated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                workspaceId TEXT NOT NULL,
                createdDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `)

        // Create indexes for performance
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS IDX_marketplace_submissions_workspace ON marketplace_submissions (workspaceId);
            CREATE INDEX IF NOT EXISTS IDX_marketplace_submissions_status ON marketplace_submissions (status);
            CREATE INDEX IF NOT EXISTS IDX_marketplace_submissions_category ON marketplace_submissions (category);
            CREATE INDEX IF NOT EXISTS IDX_agent_experiences_agent ON agent_experiences (agentId, agentType);
            CREATE INDEX IF NOT EXISTS IDX_agent_experiences_workflow ON agent_experiences (workflowId);
            CREATE INDEX IF NOT EXISTS IDX_agent_experiences_workspace ON agent_experiences (workspaceId);
            CREATE INDEX IF NOT EXISTS IDX_workflow_templates_category ON workflow_templates (category);
            CREATE INDEX IF NOT EXISTS IDX_workflow_templates_workspace ON workflow_templates (workspaceId);
            CREATE INDEX IF NOT EXISTS IDX_workflow_templates_public ON workflow_templates (isPublic, isOfficial);
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`
            DROP INDEX IF EXISTS IDX_workflow_templates_public;
            DROP INDEX IF EXISTS IDX_workflow_templates_workspace;
            DROP INDEX IF EXISTS IDX_workflow_templates_category;
            DROP INDEX IF EXISTS IDX_agent_experiences_workspace;
            DROP INDEX IF EXISTS IDX_agent_experiences_workflow;
            DROP INDEX IF EXISTS IDX_agent_experiences_agent;
            DROP INDEX IF EXISTS IDX_marketplace_submissions_category;
            DROP INDEX IF EXISTS IDX_marketplace_submissions_status;
            DROP INDEX IF EXISTS IDX_marketplace_submissions_workspace;
        `)

        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS workflow_templates`)
        await queryRunner.query(`DROP TABLE IF EXISTS agent_experiences`)
        await queryRunner.query(`DROP TABLE IF EXISTS marketplace_submissions`)

        // Remove workspaceId column from custom_template
        await queryRunner.query(`
            ALTER TABLE custom_template DROP COLUMN workspaceId
        `).catch(() => {
            // Column might not exist, ignore error
        })
    }
}