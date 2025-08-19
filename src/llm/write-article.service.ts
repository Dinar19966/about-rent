import { Injectable } from "@nestjs/common";
import { FactsRepository } from "../db/facts.repository";
import { ArticleTemplate, FactSlice, selectTemplate } from "../common/facts.types";
import { OpenRouterService } from "./openrouter.service";
import { ArticlePrompt, ArticleResult } from "./prompt.types";

function pruneSlice(slice: FactSlice): FactSlice {
  // token-guard: не более 6 метрик и 3 notable
  const m = slice.headlineMetrics ?? {};
  const compact: any = {};
  const keys = Object.keys(m).slice(0, 6);
  for (const k of keys) compact[k] = (m as any)[k];
  return {
    ...slice,
    headlineMetrics: compact,
    notableChanges: slice.notableChanges.slice(0, 3),
    topQuotes: slice.topQuotes?.slice(0, 2),
  };
}

@Injectable()
export class WriteArticleService {
  constructor(private readonly repo: FactsRepository, private readonly llm: OpenRouterService) {}

  async writeRegionBrief(region: string, period: string, tone: "neutral"|"optimistic"|"dry"="neutral"): Promise<ArticleResult> {
    const rawSlice = await this.repo.makeSlice({ region, period });
    const slice = pruneSlice(rawSlice);
    const template = selectTemplate(slice);
    const prompt: ArticlePrompt = { template, locale: "ru-RU", tone, audience: "mass", region, period, slice, wordTarget: 150 };

    const system = `
Ты пишешь краткие заметки о рынке недвижимости.
Формат ответа JSON: { "title": string, "bullets": string[], "conclusion": string }.
Требования:
- 1 заголовок (до 80 символов).
- 3–5 буллетов, каждый ≤ 25 слов, с конкретными цифрами и периодами.
- Минимум одно сравнение м/м или г/г, если доступны соответствующие поля.
- Без советов и прогнозов. Только предоставленные факты.
- Русский язык, деловой нейтральный тон.
`;

    const out = await this.llm.complete(system, prompt);
    // базовая валидация
    return {
      title: String(out.title || "Краткая сводка"),
      bullets: Array.isArray(out.bullets) ? out.bullets.slice(0,5).map(String) : [],
      conclusion: String(out.conclusion || ""),
    };
  }
}
