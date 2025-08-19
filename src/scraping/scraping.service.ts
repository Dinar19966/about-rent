// scraping.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../db/entities/Article.entity';
import { Source } from '../db/entities/Source.entity';
import { RawItem } from '../common/types';
import { sha1, normText } from '../common/utils';
import { SOURCES } from './sources';
import { parseRss } from './parsers/rss.parser';
import { parseHtml } from './parsers/html.parser';

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);

  constructor(
    @InjectRepository(Article) private articles: Repository<Article>,
    @InjectRepository(Source) private sources: Repository<Source>,
  ) {}

  async ensureSources() {
    const existing = await this.sources.find();
    const exKeys = new Set(existing.map((s) => s.key));
    for (const s of SOURCES) {
      if (!exKeys.has(s.key)) {
        await this.sources.save({ key: s.key, name: s.name, type: s.type, url: s.url, meta: s.meta });
      }
    }
  }

  async fetchAll(): Promise<number> {
    await this.ensureSources();
    let saved = 0;
    for (const s of SOURCES) {
      try {
        const list = await this.fetchSource(s.key, s.type, s.url, s.meta as any);
        for (const it of list) {
          const id = sha1(it.url);
          const exists = await this.articles.findOneBy({ id });
          if (exists) continue;
          const rec = this.articles.create({
            id,
            sourceKey: it.sourceKey,
            url: it.url,
            title: normText(it.title),
            description: normText(it.description),
            publishedAt: it.publishedAt,
            processed: false,
          });
          await this.articles.save(rec);
          saved++;
        }
      } catch (e: any) {
        this.logger.warn(`Source ${s.key} failed: ${e.message}`);
      }
    }
    return saved;
  }

  private async fetchSource(sourceKey: string, type: 'rss' | 'html', url: string, meta: any): Promise<RawItem[]> {
    if (type === 'rss') return parseRss(sourceKey, url);
    return parseHtml(sourceKey, url, meta);
  }

  async pickupUnprocessed(limit = 5): Promise<Article[]> {
    return this.articles.find({ where: { processed: false }, order: { publishedAt: 'DESC' }, take: limit });
  }

  async markProcessed(id: string) {
    await this.articles.update({ id }, { processed: true });
  }
}
