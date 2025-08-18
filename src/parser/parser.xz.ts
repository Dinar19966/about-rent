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
