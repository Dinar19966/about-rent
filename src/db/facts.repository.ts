import dayjs from "dayjs";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { FactRecord, FactSlice } from "../common/facts.types";

type SaveResult = { upserted: number; skipped: number; };

@Injectable()
export class FactsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async dedup(records: FactRecord[]): Promise<FactRecord[]> {
    // база сама «склеит» по уникальному ключу; тут просто отфильтруем повтор по value+unit
    const uniques: FactRecord[] = [];
    for (const r of records) {
      const exists = await this.prisma.fact.findUnique({
        where: { source_indicator_region_period: {
          source: r.source, indicator: r.indicator, region: r.region, period: r.period,
        }}
      });
      if (!exists || exists.value !== r.value || exists.unit !== r.unit) uniques.push(r);
    }
    return uniques;
  }

  async save(records: FactRecord[]): Promise<SaveResult> {
    let upserted = 0, skipped = 0;
    for (const r of records) {
      try {
        await this.prisma.fact.upsert({
          where: { source_indicator_region_period: {
            source: r.source, indicator: r.indicator, region: r.region, period: r.period,
          }},
          create: {
            source: r.source, indicator: r.indicator, region: r.region, period: r.period,
            value: r.value, unit: r.unit, meta: r.meta ?? {}, fetchedAt: new Date(r.fetchedAt),
            publishedAt: r.publishedAt ? new Date(r.publishedAt) : null, sourceUrl: r.sourceUrl ?? null,
            checksum: r.checksum ?? null,
          },
          update: {
            value: r.value, unit: r.unit, meta: r.meta ?? {}, fetchedAt: new Date(r.fetchedAt),
            publishedAt: r.publishedAt ? new Date(r.publishedAt) : null, sourceUrl: r.sourceUrl ?? null,
            checksum: r.checksum ?? null,
          }
        });
        upserted++;
      } catch { skipped++; }
    }
    return { upserted, skipped };
  }

  // Узкая витрина для LLM
  async makeSlice({ region, period }: { region: string; period: string; }): Promise<FactSlice> {
    const facts = await this.prisma.fact.findMany({ where: { region, period } });
    const val = (ind: string) => facts.find(f => f.indicator === ind)?.value;

    // ищем предыдущие периоды
    const prevMonth = dayjs(period + "-01").subtract(1, "month").format("YYYY-MM");
    const prevYear  = dayjs(period + "-01").subtract(1, "year").format("YYYY-MM");

    const priceNow = val("price_m2");
    const pricePrevM = await this.prisma.fact.findUnique({
      where: { source_indicator_region_period: { source: facts[0]?.source ?? "unknown", indicator: "price_m2", region, period: prevMonth }}
    }).catch(()=>null);
    const pricePrevY = await this.prisma.fact.findUnique({
      where: { source_indicator_region_period: { source: facts[0]?.source ?? "unknown", indicator: "price_m2", region, period: prevYear }}
    }).catch(()=>null);

    const mom_pct = priceNow && pricePrevM ? +(((priceNow - pricePrevM.value) / pricePrevM.value) * 100).toFixed(1) : undefined;
    const yoy_pct = priceNow && pricePrevY ? +(((priceNow - pricePrevY.value) / pricePrevY.value) * 100).toFixed(1) : undefined;

    const slice: FactSlice = {
      region, period,
      headlineMetrics: {
        price_m2: priceNow,
        mom_pct, yoy_pct,
        mortgage_rate_avg: val("mortgage_rate_avg"),
        issuance_bln: val("mortgage_issuance") ? +(val("mortgage_issuance")!/1e9).toFixed(1) : undefined,
        new_housing_input_th_m2: val("new_housing_input") ? +(val("new_housing_input")!/1e3).toFixed(1) : undefined,
      },
      notableChanges: [],
    };

    // компакт: только до 3 событий изменения
    if (mom_pct !== undefined) slice.notableChanges.push({ indicator: "price_m2", deltaPct: mom_pct, refPeriod: prevMonth });
    if (yoy_pct !== undefined) slice.notableChanges.push({ indicator: "price_m2", deltaPct: yoy_pct, refPeriod: prevYear });

    return slice;
  }
}
