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

export enum KeywordMatchType {
  EXACT = 'exact',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  REGEX = 'regex',
}

@Entity('keywords')
export class Keyword {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  keyword: string;

  @Column({
    type: 'enum',
    enum: KeywordMatchType,
    default: KeywordMatchType.CONTAINS,
  })
  matchType: KeywordMatchType;

  @Column({ type: 'text' })
  response: string;

  @Column({ default: 0 })
  priority: number;

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
