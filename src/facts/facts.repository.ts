import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import crypto from 'crypto';

export type FactRecord = {
  source: string;
  indicator: string;
  region: string;
  period: string;
  value: number;
  unit: 'RUB_M2' | 'PCT' | 'UNITS' | 'RUB' | 'BPS';
  meta?: Record<string, string>;
  fetchedAt: Date;
  publishedAt?: Date | null;
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
  sources: string[];
};

@Injectable()
export class FactsRepository {
  constructor(private prisma: PrismaService) {}

  async upsertFacts(records: FactRecord[]) {
    const results = [];
    for (const r of records) {
      const res = await this.prisma.fact.upsert({
        where: { uniq_fact_key: { source: r.source, indicator: r.indicator, region: r.region, period: r.period } },
        update: { value: r.value, unit: r.unit, meta: r.meta ?? {}, fetchedAt: r.fetchedAt, publishedAt: r.publishedAt ?? null },
        create: { source: r.source, indicator: r.indicator, region: r.region, period: r.period, value: r.value, unit: r.unit, meta: r.meta ?? {}, fetchedAt: r.fetchedAt, publishedAt: r.publishedAt ?? null },
      });
      results.push(res);
    }
    return results;
  }

  async makeSlice(params: { region: string; period: string; indicators?: string[] }) : Promise<FactSlice> {
    const { region, period } = params;
    const [currFacts, prevFacts, yoyFacts] = await Promise.all([
      this.prisma.fact.findMany({ where: { region, period } }),
      this.prisma.fact.findMany({ where: { region, period: this.shiftPeriod(period, -1) } }),
      this.prisma.fact.findMany({ where: { region, period: this.shiftPeriod(period, -12) } }),
    ]);

    const get = (facts: any[], indicator: string) => facts.find(f => f.indicator === indicator)?.value;
    const headlineMetrics: FactSlice['headlineMetrics'] = {};
    const price = get(currFacts, 'price_m2');
    if (typeof price === 'number') headlineMetrics.price_m2 = this.round(price, 100);
    const mom = this.calcPct(get(prevFacts, 'price_m2'), price);
    if (typeof mom === 'number') headlineMetrics.mom_pct = this.roundPct(mom);
    const yoy = this.calcPct(get(yoyFacts, 'price_m2'), price);
    if (typeof yoy === 'number') headlineMetrics.yoy_pct = this.roundPct(yoy);
    const mortgage = get(currFacts, 'mortgage_rate_avg');
    if (typeof mortgage === 'number') headlineMetrics.mortgage_rate_avg = Number(mortgage.toFixed(2));

    const sources = Array.from(new Set(currFacts.map(f => (f.meta as any)?.src).filter(Boolean)));

    return {
      region,
      period,
      headlineMetrics,
      notableChanges: [],
      sources,
    };
  }

  private shiftPeriod(period: string, months: number) {
    const [y,m] = period.split('-').map(Number);
    const d = new Date(Date.UTC(y, (m-1)+months, 1));
    const yy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth()+1).padStart(2, '0');
    return `${yy}-${mm}`;
  }

  private calcPct(prev?: number, curr?: number) {
    if (typeof prev !== 'number' || typeof curr !== 'number' || prev === 0) return undefined;
    return ((curr - prev) / prev) * 100;
  }

  private round(x: number, base: number) {
    return Math.round(x / base) * base;
  }
  private roundPct(x: number) {
    return Math.round(x * 10) / 10;
  }

  sliceHash(slice: FactSlice) {
    const h = crypto.createHash('sha256');
    h.update(JSON.stringify(slice));
    return h.digest('hex').slice(0, 16);
  }

  async saveArticle(a: {
    region: string;
    period: string;
    template: string;
    title: string;
    bullets: string[];
    conclusion: string;
    sliceHash: string;
    sources: string[];
  }) {
    return this.prisma.article.create({ data: {
      region: a.region, period: a.period, template: a.template, title: a.title,
      bullets: a.bullets as any, conclusion: a.conclusion, sliceHash: a.sliceHash, sources: a.sources as any
    }});
  }
}