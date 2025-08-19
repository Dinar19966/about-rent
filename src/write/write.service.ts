import { Injectable } from '@nestjs/common';
import { FactsRepository } from '../facts/facts.repository.js';
import { selectTemplate, ArticleTemplate } from './select-template.js';
import { OpenRouterService } from './openrouter.service.js';
import { ArticleSchema } from './schemas.js';

type Prompt = {
  template: ArticleTemplate;
  locale: 'ru-RU';
  tone: 'neutral' | 'optimistic' | 'dry';
  audience: 'mass' | 'pro';
  region: string;
  period: string;
  slice: any;
  wordTarget: 120 | 180;
};

const SYSTEM = `Ты — экономный автор коротких заметок о рынке недвижимости.
Пиши 1 заголовок, 3–5 маркеров, 1 вывод.
Опирайся ТОЛЬКО на данные из объекта "slice".
Не выдумывай фактов, не цитируй источники напрямую.
Числа округляй: цены — до сотен, проценты — до 0.1.
Верни строгий JSON: {"title": "...", "bullets": ["..."], "conclusion": "..."}.`;

@Injectable()
export class WriteService {
  constructor(private facts: FactsRepository, private llm: OpenRouterService) {}

  async writeRegionBrief(region: string, period: string) {
    const slice = await this.facts.makeSlice({ region, period });
    const template = selectTemplate(slice);
    const prompt: Prompt = {
      template, locale: 'ru-RU', tone: 'neutral', audience: 'mass', region, period, slice, wordTarget: 150
    };

    const user = JSON.stringify(prompt);
    const text = await this.llm.completeJSON(SYSTEM, user);
    // Validate JSON
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      // retry with stricter instruction (one shot)
      const retryText = await this.llm.completeJSON(SYSTEM + "\\nВерни строго валидный JSON без пояснений.", user);
      parsed = JSON.parse(retryText);
    }
    const result = ArticleSchema.parse(parsed);
    const sliceHash = this.facts.sliceHash(slice);
    const saved = await this.facts.saveArticle({
      region, period, template, title: result.title, bullets: result.bullets, conclusion: result.conclusion, sliceHash, sources: slice.sources
    });
    return saved;
  }
}