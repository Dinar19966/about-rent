// scheduler.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { ScrapingModule } from '../scraping/scraping.module';
import { LlmModule } from '../llm/llm.module';
import { TelegramModule } from '../posting/telegram.module';
import { ConfigModule } from '../config/config.module';
import { DbModule } from '../db/db.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ScrapingModule,
    LlmModule,
    TelegramModule,
    ConfigModule,
    DbModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
