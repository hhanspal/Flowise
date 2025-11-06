import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('agent_experiences')
export class AgentExperience {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    @Index()
    agentId: string;

    @Column({ type: 'varchar', length: 255 })
    @Index()
    userId: string;

    @Column({ type: 'varchar', length: 100 })
    @Index()
    category: string;

    @Column({ type: 'varchar', length: 255 })
    taskType: string;

    @Column({ type: 'text' })
    taskDescription: string;

    @Column({ type: 'json' })
    executionContext: any;

    @Column({ type: 'json' })
    outcome: any;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    successRating: number;

    @Column({ type: 'text', nullable: true })
    feedback: string;

    @Column({ type: 'json', nullable: true })
    performanceMetrics: any;

    @Column({ type: 'json', nullable: true })
    learningInsights: any;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}