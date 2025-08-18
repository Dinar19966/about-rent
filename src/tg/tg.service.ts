import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TgService {
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN;
  private readonly chatId = process.env.TELEGRAM_CHAT_ID;

  async sendPost(text: string): Promise<void> {
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

      await axios.post(url, {
        chat_id: this.chatId,
        text,
        parse_mode: 'HTML', // поддержка форматирования
        disable_web_page_preview: true,
      });

      console.log('[TG] Пост успешно отправлен');
    } catch (error) {
      console.error('[TG] Ошибка при отправке поста:', error.message);
    }
  }
}
