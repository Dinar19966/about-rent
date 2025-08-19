import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { PrismaService } from './db/prisma.service';
import { FactsRepository } from './db/facts.repository';
import { SourceRegistry } from './config/sources.registry';
import { IngestJob } from './ingest/ingest.job';
import { OpenRouterService } from './llm/openrouter.service';
import { WriteArticleService } from './llm/write-article.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [
    PrismaService,
    FactsRepository,
    SourceRegistry,
    IngestJob,
    OpenRouterService,
    WriteArticleService,
  ],
})
export class AppModule {}
