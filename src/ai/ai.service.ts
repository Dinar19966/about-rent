import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AiService {
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly model = 'openchat/openchat-3.5'; // бесплатная модель
  private readonly apiKey = process.env.OPENROUTER_API_KEY;

  async analyze(data: string): Promise<string> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Ты — аналитик рынка недвижимости. Кратко и по делу комментируй данные для инвесторов.',
            },
            {
              role: 'user',
              content: `Вот данные: \n${data}\n\nСделай из этого короткий Telegram-пост (до 500 символов).`,
            },
          ],
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const text = response.data.choices?.[0]?.message?.content;
      return text?.trim() || '[AI] Нет ответа';
    } catch (error) {
      console.error('[AI] Ошибка при вызове OpenRouter:', error.message);
      return '[AI] Ошибка генерации поста';
    }
  }
}
