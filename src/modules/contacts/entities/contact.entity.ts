import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ContactTag } from './contact-tag.entity';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  phoneNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'jsonb', nullable: true })
  customFields: Record<string, any>;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToMany(() => ContactTag)
  @JoinTable({
    name: 'contact_tags_contact_tags',
    joinColumn: { name: 'contactId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: ContactTag[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
