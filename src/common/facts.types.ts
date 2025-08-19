export type RuRealEstateSource =
  | "CIAN_MARKET_CSV"
  | "DOMRF_RATES_XLSX"
  | "ROSSTAT_NEW_HOUSING_HTML"
  | (string & {});

export type UnitBase = "RUB" | "PCT" | "UNITS" | "BPS";
export type FactUnit = { base: UnitBase; per?: "m2" };

export type FactRecord = {
  source: RuRealEstateSource;
  indicator: string;
  region: string;        // ISO code
  period: string;        // YYYY-MM
  value: number;
  unit: FactUnit;
  fetchedAt: Date;
  publishedAt?: Date | null;
  meta?: Record<string, string | number>;
};

export type FactSlice = {
  region: string;
  period: string;
  headlineMetrics?: Partial<{
    price_m2: number;
    mom_pct: number;
    yoy_pct: number;
    mortgage_rate_avg: number;
    issuance_bln: number;            // bln RUB
    new_housing_input_th_m2: number; // thousand m2
  }>;
  notableChanges?: Array<{ indicator: string; deltaPct: number; refPeriod: string }>;
  topQuotes?: string[];
  sources: string[];
};

export enum ArticleTemplate {
  PRICE_OVERVIEW = "PRICE_OVERVIEW",
  MORTGAGE_OVERVIEW = "MORTGAGE_OVERVIEW",
  NEW_SUPPLY = "NEW_SUPPLY",
  MIXED_BRIEF = "MIXED_BRIEF",
}

export function selectTemplate(slice: FactSlice): ArticleTemplate {
  const m = slice.headlineMetrics ?? {};
  if (m.price_m2 && (m.mom_pct ?? m.yoy_pct)) return ArticleTemplate.PRICE_OVERVIEW;
  if (m.mortgage_rate_avg ?? m.issuance_bln) return ArticleTemplate.MORTGAGE_OVERVIEW;
  if (m.new_housing_input_th_m2) return ArticleTemplate.NEW_SUPPLY;
  return ArticleTemplate.MIXED_BRIEF;
}

export const has = <T>(v: T | undefined | null): v is T => v !== undefined && v !== null;
