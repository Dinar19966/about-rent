import { Injectable } from '@nestjs/common';
import { FactsRepository } from '../db/facts.repository.js';
import { selectTemplate, FactSlice } from '../common/facts.types.js';
import { OpenRouterService } from './openrouter.service.js';

type ArticleResult = { title: string; bullets: string[]; conclusion: string; };

const pruneSlice = (s: FactSlice): FactSlice => ({
  ...s,
  headlineMetrics: s.headlineMetrics ? Object.fromEntries(Object.entries(s.headlineMetrics).slice(0, 6)) : undefined,
  notableChanges: s.notableChanges?.slice(0, 3),
  topQuotes: s.topQuotes?.slice(0, 2),
});

const SYSTEM = `
Ты пишешь краткие заметки о рынке недвижимости.
Формат ответа JSON: { "title": string, "bullets": string[], "conclusion": string }.
Требования:
- 1 заголовок (до 80 символов).
- 3–5 буллетов, каждый ≤ 25 слов, конкретные цифры и периоды.
- 1 заключение (1–2 предложения), без воды.
Только JSON, без пояснений.
`;

@Injectable()
export class WriteArticleService {
  constructor(private readonly repo: FactsRepository, private readonly llm: OpenRouterService) {}

  async writeRegionBrief(region: string, period: string, tone: 'neutral'|'optimistic'|'dry'='neutral') {
    const rawSlice = await this.repo.makeSlice({ region, period });
    const slice = pruneSlice(rawSlice);
    const template = selectTemplate(slice);

    const user = { template, region, period, tone, slice };
    const text = await this.llm.complete(SYSTEM, user);
    const parsed = JSON.parse(text) as ArticleResult;

    const sliceHash = this.repo.sliceHash(slice);
    const saved = await this.repo.saveArticle({
      region, period, template, title: parsed.title, bullets: parsed.bullets,
      conclusion: parsed.conclusion, sliceHash, sources: slice.sources
    });

    return { template, ...saved };
  }
}
