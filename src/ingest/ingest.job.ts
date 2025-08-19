import { Cron, CronExpression } from "@nestjs/schedule";
import { Injectable, Logger } from "@nestjs/common";
import { FactsRepository } from "../db/facts.repository";
import { SourceRegistry } from "../config/sources.registry";
import { discover, fetchNarrow } from "./discovery-fetch";

@Injectable()
export class IngestJob {
  private readonly log = new Logger(IngestJob.name);
  constructor(private readonly repo: FactsRepository, private readonly sources: SourceRegistry) {}

  // можно сменить расписание
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async run() {
    for (const rule of this.sources.all()) {
      try {
        const discovered = await discover(rule);
        for (const item of discovered) {
          const raw = await fetchNarrow(item, rule);
          const facts = await rule.mapper(raw);
          const unique = await this.repo.dedup(facts);
          if (unique.length) {
            await this.repo.save(unique);
            this.log.log(`[${rule.id}] saved ${unique.length}`);
          } else {
            this.log.log(`[${rule.id}] nothing new`);
          }
        }
      } catch (e) {
        this.log.error(`[${rule.id}] failed: ${String((e as any).message || e)}`);
      }
    }
  }
}
