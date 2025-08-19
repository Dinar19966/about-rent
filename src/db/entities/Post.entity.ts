// Post.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column()
  articleId!: string;

  @Column({ type: 'text' })
  text!: string;

  @Column({ default: 'draft' })
  status!: 'draft' | 'queued' | 'posted' | 'failed';

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  postedAt?: Date;

  @Column({ nullable: true })
  error?: string;
}
