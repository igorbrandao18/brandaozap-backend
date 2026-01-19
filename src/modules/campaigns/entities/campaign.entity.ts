import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WhatsAppSession } from '../../whatsapp/entities/whatsapp-session.entity';

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb' })
  recipients: string[]; // Array de números de telefone

  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus;

  @Column({ nullable: true })
  scheduledAt: Date;

  @Column({ default: 0 })
  totalRecipients: number;

  @Column({ default: 0 })
  sentCount: number;

  @Column({ default: 0 })
  deliveredCount: number;

  @Column({ default: 0 })
  readCount: number;

  @Column({ default: 0 })
  failedCount: number;

  @ManyToOne(() => WhatsAppSession)
  @JoinColumn({ name: 'sessionId' })
  session: WhatsAppSession;

  @Column()
  sessionId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
