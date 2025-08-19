export enum ArticleTemplate {
  PRICE_OVERVIEW = 'PRICE_OVERVIEW',
  MORTGAGE_OVERVIEW = 'MORTGAGE_OVERVIEW',
  NEW_SUPPLY = 'NEW_SUPPLY',
  MIXED_BRIEF = 'MIXED_BRIEF',
}

const has = (n?: number) => typeof n === 'number' && !Number.isNaN(n);

export function selectTemplate(slice: { headlineMetrics: any }) : ArticleTemplate {
  const m = slice?.headlineMetrics || {};
  if (has(m.price_m2) && (has(m.mom_pct) || has(m.yoy_pct))) return ArticleTemplate.PRICE_OVERVIEW;
  if (has(m.mortgage_rate_avg) || has(m.issuance_bln)) return ArticleTemplate.MORTGAGE_OVERVIEW;
  if (has(m.new_housing_input_th_m2)) return ArticleTemplate.NEW_SUPPLY;
  return ArticleTemplate.MIXED_BRIEF;
}