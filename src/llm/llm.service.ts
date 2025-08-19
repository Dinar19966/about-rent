// llm.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import OpenAI from 'openai';

// Интеграция через OpenAI SDK + кастомный baseURL (рекомендуется в OpenRouter)
// Документация: quickstart, auth, API-референс. :contentReference[oaicite:2]{index=2}
@Injectable()
export class LlmService {
  private client: OpenAI;
  private model: string;

  constructor(private cfg: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.cfg.openRouterKey!,
      baseURL: this.cfg.openRouterBase || 'https://openrouter.ai/api/v1',
    });
    this.model = this.cfg.openRouterModel || 'anthropic/claude-3.5-sonnet';
  }

  async generatePost(opts: {
    headline: string;
    url: string;
    sourceName: string;
    snippet?: string;
  }): Promise<string> {
    const system =
      'Ты — редактор телеграм-канала о рынке недвижимости РФ. Пиши кратко (350–500 знаков), по делу, без кликбейта. Структура: 1) тезис/факт, 2) почему важно, 3) что это значит для читателя. Добавляй 1–2 эмодзи максимум. В конце — ссылка на источник.';
    const user = `Заголовок: ${opts.headline}
Источник: ${opts.sourceName}
Ссылка: ${opts.url}
Краткое описание: ${opts.snippet || 'нет'}
Сгенерируй 1 короткий пост (без хэштегов).`;

    const res = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.7,
      max_tokens: 220,
    });

    const text = res.choices?.[0]?.message?.content?.trim() || '';
    return text;
  }
}
