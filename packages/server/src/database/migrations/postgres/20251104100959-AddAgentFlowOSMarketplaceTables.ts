import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAgentFlowOSMarketplaceTables20251104100959 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add workspaceId to existing custom_template table if not exists
        await queryRunner.query(`
            ALTER TABLE custom_template
            ADD COLUMN IF NOT EXISTS "workspaceId" text NOT NULL DEFAULT ''
        `)

        // Create marketplace_submissions table for community submissions
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS marketplace_submissions (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                "templateId" uuid NOT NULL,
                "submitterId" text NOT NULL,
                "submitterName" text NOT NULL,
                "submitterEmail" text,
                "category" text NOT NULL,
                "tags" text[],
                "status" text NOT NULL DEFAULT 'pending',
                "reviewNotes" text,
                "reviewedBy" text,
                "reviewedAt" timestamp,
                "downloadCount" integer NOT NULL DEFAULT 0,
                "rating" numeric(3,2),
                "reviewCount" integer NOT NULL DEFAULT 0,
                "featured" boolean NOT NULL DEFAULT false,
                "workspaceId" text NOT NULL,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_marketplace_submissions" PRIMARY KEY (id)
            );
        `)

        // Create agent_experiences table for agent learning and adaptation
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS agent_experiences (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                "agentId" text NOT NULL,
                "agentType" text NOT NULL,
                "workflowId" uuid,
                "executionId" uuid,
                "inputData" jsonb,
                "outputData" jsonb,
                "performance" jsonb,
                "success" boolean NOT NULL,
                "errorMessage" text,
                "executionTime" integer,
                "tokenUsage" integer,
                "cost" numeric(10,6),
                "lessonsLearned" jsonb,
                "adaptations" jsonb,
                "confidence" numeric(3,2),
                "feedback" text,
                "workspaceId" text NOT NULL,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_agent_experiences" PRIMARY KEY (id)
            );
        `)

        // Create workflow_templates table for enhanced template management
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS workflow_templates (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" text NOT NULL,
                "description" text,
                "category" text NOT NULL,
                "tags" text[],
                "framework" text,
                "usecases" text[],
                "complexity" text DEFAULT 'beginner',
                "estimatedTime" integer,
                "prerequisites" text[],
                "flowData" text NOT NULL,
                "thumbnail" text,
                "screenshots" text[],
                "author" text,
                "authorId" text,
                "version" text DEFAULT '1.0.0',
                "isPublic" boolean NOT NULL DEFAULT false,
                "isOfficial" boolean NOT NULL DEFAULT false,
                "downloadCount" integer NOT NULL DEFAULT 0,
                "rating" numeric(3,2),
                "reviewCount" integer NOT NULL DEFAULT 0,
                "lastUpdated" timestamp NOT NULL DEFAULT now(),
                "workspaceId" text NOT NULL,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_workflow_templates" PRIMARY KEY (id)
            );
        `)

        // Create indexes for performance
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_marketplace_submissions_workspace" ON marketplace_submissions ("workspaceId");
            CREATE INDEX IF NOT EXISTS "IDX_marketplace_submissions_status" ON marketplace_submissions ("status");
            CREATE INDEX IF NOT EXISTS "IDX_marketplace_submissions_category" ON marketplace_submissions ("category");
            CREATE INDEX IF NOT EXISTS "IDX_agent_experiences_agent" ON agent_experiences ("agentId", "agentType");
            CREATE INDEX IF NOT EXISTS "IDX_agent_experiences_workflow" ON agent_experiences ("workflowId");
            CREATE INDEX IF NOT EXISTS "IDX_agent_experiences_workspace" ON agent_experiences ("workspaceId");
            CREATE INDEX IF NOT EXISTS "IDX_workflow_templates_category" ON workflow_templates ("category");
            CREATE INDEX IF NOT EXISTS "IDX_workflow_templates_workspace" ON workflow_templates ("workspaceId");
            CREATE INDEX IF NOT EXISTS "IDX_workflow_templates_public" ON workflow_templates ("isPublic", "isOfficial");
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_workflow_templates_public";
            DROP INDEX IF EXISTS "IDX_workflow_templates_workspace";
            DROP INDEX IF EXISTS "IDX_workflow_templates_category";
            DROP INDEX IF EXISTS "IDX_agent_experiences_workspace";
            DROP INDEX IF EXISTS "IDX_agent_experiences_workflow";
            DROP INDEX IF EXISTS "IDX_agent_experiences_agent";
            DROP INDEX IF EXISTS "IDX_marketplace_submissions_category";
            DROP INDEX IF EXISTS "IDX_marketplace_submissions_status";
            DROP INDEX IF EXISTS "IDX_marketplace_submissions_workspace";
        `)

        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS workflow_templates`)
        await queryRunner.query(`DROP TABLE IF EXISTS agent_experiences`)
        await queryRunner.query(`DROP TABLE IF EXISTS marketplace_submissions`)

        // Remove workspaceId column from custom_template
        await queryRunner.query(`
            ALTER TABLE custom_template DROP COLUMN IF EXISTS "workspaceId"
        `)
    }
}