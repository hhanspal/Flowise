import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('workflow_templates')
export class WorkflowTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    @Index()
    workspaceId: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'varchar', length: 100 })
    @Index()
    category: string;

    @Column({ type: 'json' })
    templateData: any;

    @Column({ type: 'json', nullable: true })
    metadata: any;

    @Column({ type: 'varchar', length: 50, default: 'draft' })
    @Index()
    status: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    creatorId: string;

    @Column({ type: 'boolean', default: false })
    isPublic: boolean;

    @Column({ type: 'int', default: 0 })
    usageCount: number;

    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    averageRating: number;

    @Column({ type: 'int', default: 0 })
    totalRatings: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}