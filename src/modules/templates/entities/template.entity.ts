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

export enum TemplateCategory {
  AGENDAMENTO = 'agendamento',
  ORCAMENTO = 'orcamento',
  INDICACAO = 'indicacao',
  EBOOK = 'ebook',
  FAQ = 'faq',
  OUTROS = 'outros',
}

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TemplateCategory,
    default: TemplateCategory.OUTROS,
  })
  category: TemplateCategory;

  @Column({ type: 'jsonb' })
  flowData: any; // Dados do fluxo (nodes e edges)

  @Column({ default: false })
  isPublic: boolean;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
