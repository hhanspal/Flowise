import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('marketplace_submissions')
export class MarketplaceSubmission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    @Index()
    workspaceId: string;

    @Column({ type: 'varchar', length: 100 })
    @Index()
    category: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'varchar', length: 50 })
    contentType: string;

    @Column({ type: 'json' })
    content: any;

    @Column({ type: 'varchar', length: 50, default: 'pending' })
    @Index()
    status: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    submitterId: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    submitterType: string;

    @Column({ type: 'json', nullable: true })
    metadata: any;

    @Column({ type: 'json', nullable: true })
    reviewFeedback: any;

    @Column({ type: 'varchar', length: 255, nullable: true })
    reviewerId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}