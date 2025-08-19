import { Module } from '@nestjs/common';
import { IngestJob } from './ingest.job.js';
import { FactsModule } from '../facts/facts.module.js';
import { HttpClientModule } from '../common/http/http.module.js';
import { SourceRegistry } from './sources.registry.js';

@Module({
  imports: [FactsModule, HttpClientModule],
  providers: [IngestJob, SourceRegistry],
  exports: [SourceRegistry],
})
export class IngestModule {}