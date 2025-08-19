// Source.entity.ts
import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('sources')
export class Source {
  @PrimaryColumn()
  key!: string;

  @Column()
  name!: string;

  @Column()
  type!: 'rss' | 'html';

  @Column()
  url!: string;

  @Column({ type: 'simple-json', nullable: true })
  meta?: Record<string, any>;
}
