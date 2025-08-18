import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ParserModule } from './parser/parser.module';
import { AiModule } from './ai/ai.module';
import { TgModule } from './tg/tg.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ParserModule,
    AiModule,
    TgModule,
    SchedulerModule,
  ],
})
export class AppModule {}
