import { Module } from '@nestjs/common';
import { FactsModule } from '../facts/facts.module.js';
import { WriteService } from './write.service.js';
import { OpenRouterService } from './openrouter.service.js';

@Module({
  imports: [FactsModule],
  providers: [WriteService, OpenRouterService],
  exports: [WriteService],
})
export class WriteModule {}