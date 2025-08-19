import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { FactsRepository, FactRecord } from '../facts/facts.repository.js';
import { SourceRegistry } from './sources.registry.js';

@Injectable()
export class IngestJob {
  private readonly logger = new Logger('IngestJob');
  constructor(
    private readonly facts: FactsRepository,
    private readonly sources: SourceRegistry,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM, { timeZone: process.env.TIMEZONE || 'Europe/Prague' })
  async run() {
    const tz = this.config.get('TIMEZONE') || 'Europe/Prague';
    this.logger.log(`Starting ingest in TZ=${tz}`);
    for (const rule of this.sources.all()) {
      try {
        // Here you would implement discovery + fetch + map.
        // For demo, no-op; in real sources, push records from rule.mapper(raw).
        const recs: FactRecord[] = [];
        if (recs.length) await this.facts.upsertFacts(recs);
      } catch (e: any) {
        this.logger.error(`Source ${rule.id} failed: ${e?.message}`);
      }
    }
    this.logger.log('Ingest finished.');
  }
}