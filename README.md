ниже — готовая «каркас-логика» под учебный проект в NestJS, заточенная под дешёвый сбор и супер-узкие токен-лимиты (OpenRouter). Идея: вы НИКОГДА не гоняете в модель «сырые страницы». Вы заранее вытягиваете только нужные цифры/факты в компактный JSON, а затем подставляете их в шаблоны.

```ts
// 1) Конвейер: этапы (enum) — понятно, где что происходит
export enum IngestStage {
  DISCOVERY = "DISCOVERY",        // узнаём, что вышло новое (RSS/ленты/индекс)
  FETCH = "FETCH",                // скачиваем лёгкий источник (CSV/XLSX/RSS/узкие HTML-селекторы)
  EXTRACT = "EXTRACT",            // вытягиваем только факты → FactRecord[]
  NORMALIZE = "NORMALIZE",        // приводим к общей схеме/единицам
  DEDUP = "DEDUP",                // убираем дубликаты/повторы
  STORE = "STORE",                // складываем «факты» (не текст страниц) в БД
  SELECT_TEMPLATE = "SELECT_TEMPLATE", // решаем, какой шаблон подходит
  WRITE = "WRITE",                // генерим мини-статью из фактов
}

// 2) Типы данных «фактов». Это то, что храните и шлёте в ИИ (узко и дёшево)
export type FactRecord = {
  id: string;
  source: RuRealEstateSource;
  indicator: 
    | "price_m2" | "price_change_mom" | "price_change_yoy"
    | "mortgage_rate_avg" | "mortgage_issuance"
    | "new_housing_input" | "transactions_count"
    | "rent_price_median" | "supply_index" | "demand_index";
  region: string;                  // "RU-MOW", "RU-SPE", и т.п.
  period: string;                  // "2025-07" или ISO дата
  value: number;
  unit: "RUB_M2" | "PCT" | "UNITS" | "RUB" | "BPS";
  meta?: Record<string, string>;   // например: "segment":"primary/secondary"
  fetchedAt: string;               // ISO
  publishedAt?: string;
};

// 3) Минимальная «витрина» для шаблонов: агрегированные факты
export type FactSlice = {
  region: string;
  period: string;
  headlineMetrics: Partial<{
    price_m2: number;
    mom_pct: number;
    yoy_pct: number;
    mortgage_rate_avg: number;
    issuance_bln: number;
    new_housing_input_th_m2: number;
  }>;
  notableChanges: Array<{indicator: string; deltaPct?: number; deltaAbs?: number; refPeriod: string;}>;
  topQuotes?: Array<{who: string; text: string; date?: string; src?: string;}>;
};

// 4) Шаблоны статей — под конкретные наборы полей
export enum ArticleTemplate {
  PRICE_OVERVIEW = "PRICE_OVERVIEW",        // есть price_m2 + динамика m/m или y/y
  MORTGAGE_OVERVIEW = "MORTGAGE_OVERVIEW",  // есть mortgage_rate_avg/issuance
  NEW_SUPPLY = "NEW_SUPPLY",                // есть new_housing_input / supply_index
  MIXED_BRIEF = "MIXED_BRIEF",              // понемногу всего, но без глубины
}

// 5) Правила выбора шаблона (детерминированно, без ИИ)
export function selectTemplate(slice: FactSlice): ArticleTemplate {
  const m = slice.headlineMetrics || {};
  if (m.price_m2 && (m.mom_pct || m.yoy_pct)) return ArticleTemplate.PRICE_OVERVIEW;
  if (m.mortgage_rate_avg || m.issuance_bln) return ArticleTemplate.MORTGAGE_OVERVIEW;
  if (m.new_housing_input_th_m2) return ArticleTemplate.NEW_SUPPLY;
  return ArticleTemplate.MIXED_BRIEF;
}
```

# как собирать данные без «выгрузки страниц целиком»

## 0) принцип «узких труб»

1. сначала **DISCOVERY**: RSS/ленты/индекс-страницы (дешёвые).
2. по клику — **FETCH** только лёгкие носители: **CSV/XLSX**, **таблицы HTML** с точными селекторами, **PDF-таблицы** (не весь текст).
3. сразу **EXTRACT** цифры в `FactRecord[]`.
4. в базу кладёте **только факты** (и минимум метаданных).
5. ИИ получает **только 10–20 строк** агрегированных фактов (а не HTML).

## 1) discovery (NestJS cron + RSS/индексы)

* раз в день/неделю бегите по «источникам» и спрашивайте только «что нового».
* используйте `If-None-Match / ETag` и `If-Modified-Since`, чтобы не тянуть лишнее.
* где есть экспорт **CSV/XLSX** — берите его первым делом; где есть **RSS** — сначала заголовок+ссылка+дата; где только HTML — берите **одну** страницу и парсите **селекторы** внутри.

## 2) fetch (строго адресный)

* заранее храните в реестре источников селекторы/эндпоинты:

  * CSV: прямая ссылка на экспорт → файл весит копейки, парсится мгновенно.
  * HTML: точные `#content article time`, `.article-body table`, `meta[property=...published_time]`.
  * PDF: тяните **только** нужные страницы (если можете), либо извлекайте **только таблицы**.
* запрещено: «скачать 100 новостей и думать в модели». Сначала извлечь числа → потом думать.

## 3) extract/normalize (локально, без ИИ)

* парсеры для каждого источника выдают **только** `FactRecord[]`.
* пример нормализации:

  * цены привести к `RUB_M2` и округлять до сотен,
  * проценты — до 1 десятичного знака,
  * регионы — ISO-коды,
  * периоды — `YYYY-MM`.
* храните единый «словарь индикаторов» → позже легко матчить под шаблоны.

## 4) агрегирование в витрину (`FactSlice`)

* узким SQL-запросом вытягиваете «последние два периода» для нужного региона/индикатора,
* считаете `mom_pct`, `yoy_pct`, формируете `FactSlice` — компактный объект на 1–2 кБ.

---

# экономный prompt-дизайн (OpenRouter)

### 1) для модели: только витрина + выбранный шаблон

```ts
type ArticlePrompt = {
  template: ArticleTemplate; // уже выбран алгоритмом
  locale: "ru-RU";
  tone: "neutral" | "optimistic" | "dry";
  audience: "mass" | "pro";
  region: string;               // "RU-MOW"
  period: string;               // "2025-07"
  slice: FactSlice;             // 1–2 кБ максимум
  wordTarget: 120 | 180;        // мини-заметка
};

// Вместо «проанализируй сайт», отправляем ТОЧНЫЕ факты и целевую длину.
// Это умещается в ~1–3к токенов вместе с инструкцией.
```

### 2) подсказка-инструкция (system) — короткая и жёсткая

* «пиши 1 заголовок + 3–5 маркеров + 1 вывод; опирайся ТОЛЬКО на числа из slice; не выдумывай; добавь сравнение м/м или г/г если доступно; числа округляй по правилам; без воды».

### 3) output форматом (JSON + markdown)

* просите модель вернуть:

  ```json
  { "title": "...", "bullets": ["...","...","..."], "conclusion": "..." }
  ```
* вы сами в NestJS отрендерите Markdown/HTML (без переделки промпта).

---

# мини-реестр источников с «узкими» правилами

```ts
type SourceRule = {
  id: RuRealEstateSource;
  discovery: { type: "RSS" | "INDEX" | "DIRECT"; url: string; };
  fetch: Array<
    | { kind: "CSV"; url: string; }
    | { kind: "HTML_TABLE"; url: string; selectors: { table: string; date?: string; } }
    | { kind: "HTML_ARTICLE"; url: string; selectors: { title: string; date: string; body: string; } }
    | { kind: "XLSX"; url: string; sheet?: string; }
    | { kind: "PDF_TABLE"; url: string; pages?: number[]; }
  >;
  mapper: (raw: unknown) => FactRecord[];   // только числа!
  cadence: "daily" | "weekly" | "monthly" | "quarterly" | "ad-hoc";
}
```

---

# как это выглядит в NestJS (упрощённо)

```ts
// jobs/ingest.job.ts
@Injectable()
export class IngestJob {
  constructor(private readonly repo: FactsRepository, private readonly sources: SourceRegistry) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async run() {
    for (const rule of this.sources.all()) {
      const discovered = await discover(rule);            // HEAD/RSS/index → список новых ссылок/файлов
      for (const item of discovered) {
        const raw = await fetchNarrow(item, rule);        // CSV/XLSX/таблица/PDF-таблица
        const facts = rule.mapper(raw);                   // → FactRecord[]
        const normalized = normalize(facts);
        const unique = await this.repo.dedup(normalized); // по (source,indicator,region,period)
        if (unique.length) await this.repo.save(unique);
      }
    }
  }
}

// services/write-article.service.ts
@Injectable()
export class WriteArticleService {
  constructor(private readonly repo: FactsRepository) {}
  async writeRegionBrief(region: string, period: string) {
    const slice = await this.repo.makeSlice({ region, period }); // собираем FactSlice
    const template = selectTemplate(slice);
    const prompt: ArticlePrompt = { template, locale: "ru-RU", tone: "neutral", audience: "mass", region, period, slice, wordTarget: 150 };
    // отправка в OpenRouter (маленький запрос):
    const result = await this.callLLM(prompt); // возвращает {title, bullets[], conclusion}
    return renderMarkdown(result);
  }
}
```

---

# контроль токенов и бюджета

* **жёсткий лимит полей** в `FactSlice`: не более 6 ключевых метрик и 3 «notableChanges».
* округляйте заранее (например, цена 243 567 → 243 600; ставка 11.87 → 11.9).
* **обрезайте текст цитат** до 200 символов, максимум 2 цитаты.
* ставьте «token-guard»: если JSON > 4 кБ — пересобрать с меньшим набором метрик.
* используйте **кэш** готовых статей на сутки/неделю, чтобы не гонять модель повторно.

---

# извлечение из HTML без «полного дампа»

* целевые селекторы: `article time[datetime]`, `h1`, `table.prices`, `div.chart-data[data-series]`.
* используйте `cheerio` и **удаляйте всё лишнее** (скрипты/меню/комментарии).
* если цифра в тексте — регэксп `/(?:\+|-)?\d+(?:[.,]\d+)?\s?(?:%|₽|руб|тыс\.|млн|кв\.м)/` и словарь привязок (например, «к м/м», «к г/г», «ставка»).
* если источник даёт **schema.org/JSON-LD** — берите числовые поля из него (часто есть `price`, `datePublished`).

---

# антикризисные режимы (когда данных мало/сырье тяжёлое)

* если нет CSV/XLSX, а HTML «тяжёлый», делайте **lite-режим**: забирайте **только первую таблицу** и **первый абзац** (лимит символов по `Content-Length`).
* PDF только при явной нужде: сначала пробуйте найти **встроенную таблицу**; если нет — **пропускайте** источник (учебный проект).
* допускайте «MIXED\_BRIEF» с 2–3 фактами — лучше коротко и честно, чем перегруз.

---

# проверка и отслеживание качества

* на каждый `FactRecord` храните `source_url` и `checksum` (sha256 от исходной строки/ячейки).
* добавьте rule: «любой факт старше 90 дней — в архив, не показывать в свежих статьях».
* заведите unit-тест на селекторы: мок-HTML → `mapper()` → ожидемые FactRecord.

---

# короткий пример шаблона (PRICE\_OVERVIEW)

```ts
// system (инструкция для ИИ):
/*
Ты пишешь краткие заметки о рынке недвижимости. Используй только числа из slice.
Формат ответа JSON: { "title": string, "bullets": string[], "conclusion": string }.
Требования:
- 1 заголовок (до 80 символов).
- 3–5 буллетов, каждый ≤ 25 слов, с конкретными цифрами и периодами.
- Минимум одно сравнение м/м или г/г, если доступны соответствующие поля.
- Без советов и прогнозов. Без новых источников. Только предоставленные факты.
- Русский язык, деловой нейтральный тон.
*/
```

В итоге:

* «сбор информации» = лёгкие каналы (RSS/CSV/таблица) → **узкие извлечённые факты**;
* «ИИ» видит только 1–2 кБ фактов + выбранный шаблон → дешёво и стабильно;
* никаких «выгрузок страницы целиком» — всё режется на этапе EXTRACT/NORMALIZE.

Если хочешь, могу сгенерировать стартовые файлы для NestJS (интерфейсы, каркас репозитория и один пример `mapper()` под CSV).
