import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ParserService } from '../parser/parser.service';
import { AiService } from '../ai/ai.service';
import { TgService } from '../tg/tg.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly parser: ParserService,
    private readonly ai: AiService,
    private readonly tg: TgService,
  ) {}

  // каждый день в 10:00 по серверному времени
  @Cron('0 10 * * *')
  async handleDailyPost() {
    this.logger.log('⏰ Запуск генерации поста');
    try {
      const data = await this.parser.getDailyMarketData();
      const post = await this.ai.analyze(data);
      await this.tg.sendPost(post);
      this.logger.log('✅ Пост успешно отправлен');
    } catch (err) {
      this.logger.error('❌ Ошибка при публикации поста', err);
    }
  }

  // для тестов — каждую минуту
  // @Cron('*/60 * * * * *')
  // async testRun() {
  //   ...
  // }
}
