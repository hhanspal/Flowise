import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAgentFlowOSMarketplaceTables20251104100959 implements MigrationInterface {
    name = 'AddAgentFlowOSMarketplaceTables20251104100959'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add workspaceId to existing custom_template table if not exists
        await queryRunner.query(`
            ALTER TABLE \`custom_template\`
            ADD COLUMN IF NOT EXISTS \`workspaceId\` text NOT NULL DEFAULT ''
        `)

        // Create marketplace_submissions table for community submissions
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`marketplace_submissions\` (
                \`id\` varchar(36) NOT NULL,
                \`templateId\` varchar(36) NOT NULL,
                \`submitterId\` text NOT NULL,
                \`submitterName\` text NOT NULL,
                \`submitterEmail\` text,
                \`category\` text NOT NULL,
                \`tags\` json,
                \`status\` text NOT NULL DEFAULT 'pending',
                \`reviewNotes\` text,
                \`reviewedBy\` text,
                \`reviewedAt\` datetime,
                \`downloadCount\` int NOT NULL DEFAULT 0,
                \`rating\` decimal(3,2),
                \`reviewCount\` int NOT NULL DEFAULT 0,
                \`featured\` tinyint(1) NOT NULL DEFAULT 0,
                \`workspaceId\` text NOT NULL,
                \`createdDate\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedDate\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `)

        // Create agent_experiences table for agent learning and adaptation
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`agent_experiences\` (
                \`id\` varchar(36) NOT NULL,
                \`agentId\` text NOT NULL,
                \`agentType\` text NOT NULL,
                \`workflowId\` varchar(36),
                \`executionId\` varchar(36),
                \`inputData\` json,
                \`outputData\` json,
                \`performance\` json,
                \`success\` tinyint(1) NOT NULL,
                \`errorMessage\` text,
                \`executionTime\` int,
                \`tokenUsage\` int,
                \`cost\` decimal(10,6),
                \`lessonsLearned\` json,
                \`adaptations\` json,
                \`confidence\` decimal(3,2),
                \`feedback\` text,
                \`workspaceId\` text NOT NULL,
                \`createdDate\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `)

        // Create workflow_templates table for enhanced template management
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`workflow_templates\` (
                \`id\` varchar(36) NOT NULL,
                \`name\` text NOT NULL,
                \`description\` text,
                \`category\` text NOT NULL,
                \`tags\` json,
                \`framework\` text,
                \`usecases\` json,
                \`complexity\` text DEFAULT 'beginner',
                \`estimatedTime\` int,
                \`prerequisites\` json,
                \`flowData\` longtext NOT NULL,
                \`thumbnail\` text,
                \`screenshots\` json,
                \`author\` text,
                \`authorId\` text,
                \`version\` text DEFAULT '1.0.0',
                \`isPublic\` tinyint(1) NOT NULL DEFAULT 0,
                \`isOfficial\` tinyint(1) NOT NULL DEFAULT 0,
                \`downloadCount\` int NOT NULL DEFAULT 0,
                \`rating\` decimal(3,2),
                \`reviewCount\` int NOT NULL DEFAULT 0,
                \`lastUpdated\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`workspaceId\` text NOT NULL,
                \`createdDate\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedDate\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `)

        // Create indexes for performance
        await queryRunner.query(`CREATE INDEX \`IDX_marketplace_submissions_workspace\` ON \`marketplace_submissions\` (\`workspaceId\`(191))`)
        await queryRunner.query(`CREATE INDEX \`IDX_marketplace_submissions_status\` ON \`marketplace_submissions\` (\`status\`(191))`)
        await queryRunner.query(`CREATE INDEX \`IDX_marketplace_submissions_category\` ON \`marketplace_submissions\` (\`category\`(191))`)
        await queryRunner.query(`CREATE INDEX \`IDX_agent_experiences_agent\` ON \`agent_experiences\` (\`agentId\`(191), \`agentType\`(191))`)
        await queryRunner.query(`CREATE INDEX \`IDX_agent_experiences_workflow\` ON \`agent_experiences\` (\`workflowId\`)`)
        await queryRunner.query(`CREATE INDEX \`IDX_agent_experiences_workspace\` ON \`agent_experiences\` (\`workspaceId\`(191))`)
        await queryRunner.query(`CREATE INDEX \`IDX_workflow_templates_category\` ON \`workflow_templates\` (\`category\`(191))`)
        await queryRunner.query(`CREATE INDEX \`IDX_workflow_templates_workspace\` ON \`workflow_templates\` (\`workspaceId\`(191))`)
        await queryRunner.query(`CREATE INDEX \`IDX_workflow_templates_public\` ON \`workflow_templates\` (\`isPublic\`, \`isOfficial\`)`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX \`IDX_workflow_templates_public\` ON \`workflow_templates\``)
        await queryRunner.query(`DROP INDEX \`IDX_workflow_templates_workspace\` ON \`workflow_templates\``)
        await queryRunner.query(`DROP INDEX \`IDX_workflow_templates_category\` ON \`workflow_templates\``)
        await queryRunner.query(`DROP INDEX \`IDX_agent_experiences_workspace\` ON \`agent_experiences\``)
        await queryRunner.query(`DROP INDEX \`IDX_agent_experiences_workflow\` ON \`agent_experiences\``)
        await queryRunner.query(`DROP INDEX \`IDX_agent_experiences_agent\` ON \`agent_experiences\``)
        await queryRunner.query(`DROP INDEX \`IDX_marketplace_submissions_category\` ON \`marketplace_submissions\``)
        await queryRunner.query(`DROP INDEX \`IDX_marketplace_submissions_status\` ON \`marketplace_submissions\``)
        await queryRunner.query(`DROP INDEX \`IDX_marketplace_submissions_workspace\` ON \`marketplace_submissions\``)

        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS \`workflow_templates\``)
        await queryRunner.query(`DROP TABLE IF EXISTS \`agent_experiences\``)
        await queryRunner.query(`DROP TABLE IF EXISTS \`marketplace_submissions\``)

        // Remove workspaceId column from custom_template
        await queryRunner.query(`
            ALTER TABLE \`custom_template\` DROP COLUMN IF EXISTS \`workspaceId\`
        `)
    }
}