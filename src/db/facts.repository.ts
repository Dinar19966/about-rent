import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { FactRecord, FactSlice } from '../common/facts.types.js';

@Injectable()
export class FactsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async dedup(records: FactRecord[]): Promise<FactRecord[]> {
    if (!records.length) return [];
    const keys = records.map(r => ({
      source: r.source, indicator: r.indicator, region: r.region, period: r.period,
    }));
    const existing = await this.prisma.fact.findMany({ where: { OR: keys } });
    const map = new Map(existing.map(e => [`${e.source}|${e.indicator}|${e.region}|${e.period}`, e]));
    return records.filter(r => {
      const k = `${r.source}|${r.indicator}|${r.region}|${r.period}`;
      const ex = map.get(k);
      if (!ex) return true;
      return ex.value !== r.value || ex.unitBase !== r.unit.base || ex.unitPer !== (r.unit.per ?? null);
    });
  }

  async save(records: FactRecord[]) {
    for (const r of records) {
      await this.prisma.fact.upsert({
        where: { source_indicator_region_period: { source: r.source, indicator: r.indicator, region: r.region, period: r.period } },
        update: {
          value: r.value,
          unitBase: r.unit.base,
          unitPer: r.unit.per ?? null,
          meta: r.meta as any,
          publishedAt: r.publishedAt ?? null,
        },
        create: {
          source: r.source,
          indicator: r.indicator,
          region: r.region,
          period: r.period,
          value: r.value,
          unitBase: r.unit.base,
          unitPer: r.unit.per ?? null,
          meta: r.meta as any,
          fetchedAt: r.fetchedAt,
          publishedAt: r.publishedAt ?? null,
        },
      });
    }
  }

  async saveArticle(a: {
    region: string; period: string; template: string; title: string; bullets: string[]; conclusion: string; sliceHash: string; sources: string[];
  }) {
    return this.prisma.article.create({ data: {
      region: a.region, period: a.period, template: a.template, title: a.title,
      bullets: a.bullets as any, conclusion: a.conclusion, sliceHash: a.sliceHash, sources: a.sources as any,
    }});
  }

  async makeSlice({ region, period }: { region: string; period: string; }): Promise<FactSlice> {
    const prevM = offset(period, -1);
    const prevY = offset(period, -12);
    const facts = await this.prisma.fact.findMany({ where: { region, period: { in: [period, prevM, prevY] } } });

    const val = (ind: string, per = period) =>
      facts.find(f => f.indicator === ind && f.period === per)?.value;

    const priceNow = val('price_m2');
    const pricePrevM = val('price_m2', prevM);
    const pricePrevY = val('price_m2', prevY);
    const mom_pct = (priceNow && pricePrevM) ? round1(((priceNow / pricePrevM) - 1) * 100) : undefined;
    const yoy_pct = (priceNow && pricePrevY) ? round1(((priceNow / pricePrevY) - 1) * 100) : undefined;

    return {
      region, period,
      headlineMetrics: {
        price_m2: priceNow,
        mom_pct, yoy_pct,
        mortgage_rate_avg: val('mortgage_rate_avg'),
        issuance_bln: val('mortgage_issuance') ? +(val('mortgage_issuance')!/1e9).toFixed(1) : undefined,
        new_housing_input_th_m2: val('new_housing_input') ? +(val('new_housing_input')!/1e3).toFixed(1) : undefined,
      },
      notableChanges: [
        ...(mom_pct !== undefined ? [{ indicator: 'price_m2', deltaPct: mom_pct, refPeriod: prevM }] : []),
        ...(yoy_pct !== undefined ? [{ indicator: 'price_m2', deltaPct: yoy_pct, refPeriod: prevY }] : []),
      ],
      sources: Array.from(new Set(facts.map(f => f.source))),
    };
  }

  sliceHash(slice: FactSlice): string {
    const raw = JSON.stringify({ r: slice.region, p: slice.period, h: slice.headlineMetrics });
    let h = 0;
    for (let i = 0; i < raw.length; i++) h = (h * 31 + raw.charCodeAt(i)) >>> 0;
    return h.toString(16);
  }
}

function offset(ym: string, months: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + months, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
const round1 = (x: number) => Math.round(x * 10) / 10;
