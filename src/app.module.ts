import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { FactsModule } from './facts/facts.module.js';
import { IngestModule } from './ingest/ingest.module.js';
import { WriteModule } from './write/write.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    HttpModule,
    FactsModule,
    IngestModule,
    WriteModule,
  ],
})
export class AppModule {}