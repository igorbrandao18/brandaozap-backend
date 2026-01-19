import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WhatsAppSession } from '../../whatsapp/entities/whatsapp-session.entity';
import { Contact } from '../../contacts/entities/contact.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  LOCATION = 'location',
  CONTACT = 'contact',
}

export enum MessageDirection {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
}

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

@Entity('messages')
@Index(['sessionId', 'from', 'createdAt'])
@Index(['sessionId', 'to', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  messageId: string; // ID da mensagem do WhatsApp

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Column({
    type: 'enum',
    enum: MessageDirection,
  })
  direction: MessageDirection;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.PENDING,
  })
  status: MessageStatus;

  @Column({ type: 'text', nullable: true })
  text: string;

  @Column({ nullable: true })
  mediaUrl: string;

  @Column({ nullable: true })
  fileName: string;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column()
  from: string; // Número de telefone

  @Column()
  to: string; // Número de telefone

  @Column({ nullable: true })
  quotedMessageId: string;

  @ManyToOne(() => WhatsAppSession)
  @JoinColumn({ name: 'sessionId' })
  session: WhatsAppSession;

  @Column()
  sessionId: string;

  @ManyToOne(() => Contact, { nullable: true })
  @JoinColumn({ name: 'contactId' })
  contact: Contact;

  @Column({ nullable: true })
  contactId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
