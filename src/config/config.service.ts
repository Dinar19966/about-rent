// config.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfig } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private readonly cfg: NestConfig) {}
  get dbPath() { return this.cfg.get<string>('DB_PATH'); }

  get openRouterKey() { return this.cfg.get<string>('OPENROUTER_API_KEY'); }
  get openRouterBase() { return this.cfg.get<string>('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'); }
  get openRouterModel() { return this.cfg.get<string>('OPENROUTER_MODEL', 'anthropic/claude-3.5-sonnet'); }

  get telegramToken() { return this.cfg.get<string>('TELEGRAM_BOT_TOKEN'); }
  get telegramChatId() { return this.cfg.get<string>('TELEGRAM_CHAT_ID'); }

  get cronScrape() { return this.cfg.get<string>('CRON_SCRAPE', '*/30 * * * *'); }
  get cronPost() { return this.cfg.get<string>('CRON_POST', '*/15 * * * *'); }
}
