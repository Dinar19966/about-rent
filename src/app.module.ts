import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DbModule } from './db/db.module';
import { ScrapingModule } from './scraping/scraping.module';
import { LlmModule } from './llm/llm.module';
import { TelegramModule } from './posting/telegram.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule,
    DbModule,
    ScrapingModule,
    LlmModule,
    TelegramModule,
    SchedulerModule,
  ],
})
export class AppModule {}
