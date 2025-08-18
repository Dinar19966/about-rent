import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { ParserModule } from '../parser/parser.module';
import { AiModule } from '../ai/ai.module';
import { TgModule } from '../tg/tg.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // инициализация cron
    ParserModule,
    AiModule,
    TgModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
