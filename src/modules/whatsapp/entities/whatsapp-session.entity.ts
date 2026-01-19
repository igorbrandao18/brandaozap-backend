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

export enum SessionStatus {
  STARTING = 'starting',
  QRCODE = 'qrcode',
  WORKING = 'working',
  FAILED = 'failed',
  STOPPED = 'stopped',
}

@Entity('whatsapp_sessions')
export class WhatsAppSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  sessionId: string;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.STARTING,
  })
  status: SessionStatus;

  @Column({ nullable: true })
  qrCode: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  profileName: string;

  @Column({ nullable: true })
  profilePicture: string;

  @Column({ default: true })
  isActive: boolean;

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
