export enum IngestStage {
  DISCOVERY="DISCOVERY", FETCH="FETCH", EXTRACT="EXTRACT",
  NORMALIZE="NORMALIZE", DEDUP="DEDUP", STORE="STORE",
  SELECT_TEMPLATE="SELECT_TEMPLATE", WRITE="WRITE",
}

export type RuRealEstateSource =
  | "CIAN_MARKET_CSV"
  | "DOMRF_RATES_XLSX"
  | "ROSSTAT_NEW_HOUSING_HTML"
  | string;

export type FactRecord = {
  id: string;
  source: RuRealEstateSource;
  indicator:
    | "price_m2" | "price_change_mom" | "price_change_yoy"
    | "mortgage_rate_avg" | "mortgage_issuance"
    | "new_housing_input" | "transactions_count"
    | "rent_price_median" | "supply_index" | "demand_index";
  region: string;      // "RU-MOW" и т.п.
  period: string;      // "2025-07" или ISO
  value: number;
  unit: "RUB_M2" | "PCT" | "UNITS" | "RUB" | "BPS";
  meta?: Record<string,string>;
  fetchedAt: string;
  publishedAt?: string;
  sourceUrl?: string;
  checksum?: string;
};

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

export enum ArticleTemplate {
  PRICE_OVERVIEW="PRICE_OVERVIEW",
  MORTGAGE_OVERVIEW="MORTGAGE_OVERVIEW",
  NEW_SUPPLY="NEW_SUPPLY",
  MIXED_BRIEF="MIXED_BRIEF",
}

export function selectTemplate(slice: FactSlice): ArticleTemplate {
  const m = slice.headlineMetrics || {};
  if (m.price_m2 && (m.mom_pct || m.yoy_pct)) return ArticleTemplate.PRICE_OVERVIEW;
  if (m.mortgage_rate_avg || m.issuance_bln) return ArticleTemplate.MORTGAGE_OVERVIEW;
  if (m.new_housing_input_th_m2) return ArticleTemplate.NEW_SUPPLY;
  return ArticleTemplate.MIXED_BRIEF;
}
