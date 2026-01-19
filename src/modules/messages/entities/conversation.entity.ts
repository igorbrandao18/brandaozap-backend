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

@Entity('conversations')
@Index(['userId', 'phoneNumber'])
@Index(['sessionId', 'phoneNumber'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  phoneNumber: string;

  @Column({ nullable: true })
  lastMessage: string;

  @Column({ nullable: true })
  lastMessageType: string;

  @Column({ default: 0 })
  unreadCount: number;

  @Column({ default: false })
  isArchived: boolean;

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
