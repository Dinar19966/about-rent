// scheduler.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ScrapingService } from '../scraping/scraping.service';
import { LlmService } from '../llm/llm.service';
import { TelegramService } from '../posting/telegram.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../db/entities/Post.entity';
import { Article } from '../db/entities/Article.entity';
import { ConfigService } from '../config/config.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly scraping: ScrapingService,
    private readonly llm: LlmService,
    private readonly tg: TelegramService,
    @InjectRepository(Post) private posts: Repository<Post>,
    @InjectRepository(Article) private articles: Repository<Article>,
    private readonly cfg: ConfigService,
  ) {}

  @Cron(process.env.CRON_SCRAPE || '*/30 * * * *')
  async scrapeJob() {
    const n = await this.scraping.fetchAll();
    this.logger.log(`Scraped new items: ${n}`);
  }

  @Cron(process.env.CRON_POST || '*/15 * * * *')
  async generateAndPostJob() {
    // 1) берем несколько непроцессed статей
    const items = await this.scraping.pickupUnprocessed(3);
    for (const a of items) {
      try {
        // 2) генерируем пост
        const text = await this.llm.generatePost({
          headline: a.title,
          url: a.url,
          sourceName: a.sourceKey,
          snippet: a.description,
        });
        // 3) сохраняем пост (draft → queued)
        const saved = await this.posts.save(this.posts.create({
          articleId: a.id,
          text,
          status: 'queued',
        }));
        // 4) отправляем в Telegram
        const message = `${text}\n\n<a href="${a.url}">Источник</a>`;
        await this.tg.sendMessage(this.cfg.telegramChatId!, message);
        await this.posts.update({ id: saved.id }, { status: 'posted', postedAt: new Date() });
        await this.scraping.markProcessed(a.id);
        this.logger.log(`Posted article ${a.id}`);
      } catch (e: any) {
        this.logger.error(`Failed to post for ${a.id}: ${e.message}`);
        await this.posts.save({ articleId: a.id, text: e.message, status: 'failed', error: e.stack?.slice(0, 1000) });
        // не помечаем processed — попробуем в следующий раз
      }
    }
  }
}

