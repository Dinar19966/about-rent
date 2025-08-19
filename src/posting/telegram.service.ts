// telegram.service.ts
import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

@Injectable()
export class TelegramService {
  private token: string;
  private apiBase: string;

  constructor(private cfg: ConfigService) {
    this.token = cfg.telegramToken!;
    this.apiBase = `https://api.telegram.org/bot${this.token}`;
  }

  async sendMessage(chatId: string, text: string, disablePreview = false) {
    const url = `${this.apiBase}/sendMessage`;
    const res = await axios.post(url, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: disablePreview,
    });
    return res.data;
  }
}
