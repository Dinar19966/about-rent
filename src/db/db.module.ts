// db.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './entities/Article.entity';
import { Post } from './entities/Post.entity';
import { Source } from './entities/Source.entity';
import { ConfigService } from '../config/config.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'sqlite',
        database: cfg.dbPath || './data/app.sqlite',
        entities: [Article, Post, Source],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([Article, Post, Source]),
  ],
  exports: [TypeOrmModule],
})
export class DbModule {}
