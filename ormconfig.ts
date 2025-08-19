import { DataSource } from 'typeorm';
import { Article } from './src/db/entities/Article.entity';
import { Post } from './src/db/entities/Post.entity';
import { Source } from './src/db/entities/Source.entity';
import * as dotenv from 'dotenv';
dotenv.config();

export default new DataSource({
  type: 'sqlite',
  database: process.env.DB_PATH || './data/app.sqlite',
  entities: [Article, Post, Source],
  synchronize: true, // для продакшна лучше миграции
  logging: false,
});

