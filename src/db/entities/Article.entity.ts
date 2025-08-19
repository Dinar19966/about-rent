// Article.entity.ts
import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('articles')
export class Article {
  @PrimaryColumn()
  id!: string; // sha1(url)

  @Index()
  @Column()
  sourceKey!: string;

  @Column()
  url!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'datetime', nullable: true })
  publishedAt?: Date;

  @Column({ default: false })
  processed!: boolean;
}
