import dayjs from "dayjs";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { FactRecord, FactSlice } from "../common/facts.types";

@Injectable()
export class FactsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async dedup(records: FactRecord[]): Promise<FactRecord[]> {
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

  async save(records: FactRecord[]) {
    for (const r of records) {
      await this.prisma.fact.upsert({
        where: { source_indicator_region_period: {
          source: r.source, indicator: r.indicator, region: r.region, period: r.period,
        }},
        create: {
          source: r.source, indicator: r.indicator, region: r.region, period: r.period,
          value: r.value, unit: r.unit, meta: r.meta ?? {}, fetchedAt: new Date(r.fetchedAt),
          publishedAt: r.publishedAt ? new Date(r.publishedAt) : null,
          sourceUrl: r.sourceUrl ?? null, checksum: r.checksum ?? null,
        },
        update: {
          value: r.value, unit: r.unit, meta: r.meta ?? {}, fetchedAt: new Date(r.fetchedAt),
          publishedAt: r.publishedAt ? new Date(r.publishedAt) : null,
          sourceUrl: r.sourceUrl ?? null, checksum: r.checksum ?? null,
        }
      });
    }
  }

  async makeSlice({ region, period }: { region: string; period: string; }): Promise<FactSlice> {
    const facts = await this.prisma.fact.findMany({ where: { region, period } });
    const val = (ind: string) => facts.find(f => f.indicator === ind)?.value;

    const prevM = dayjs(period + "-01").subtract(1, "month").format("YYYY-MM");
    const prevY = dayjs(period + "-01").subtract(1, "year").format("YYYY-MM");

    const source = facts[0]?.source ?? "unknown";
    const priceNow = val("price_m2");

    const pricePrevM = priceNow ? await this.prisma.fact.findUnique({
      where: { source_indicator_region_period: { source, indicator: "price_m2", region, period: prevM } }
    }).catch(()=>null) : null;

    const pricePrevY = priceNow ? await this.prisma.fact.findUnique({
      where: { source_indicator_region_period: { source, indicator: "price_m2", region, period: prevY } }
    }).catch(()=>null) : null;

    const mom_pct = priceNow && pricePrevM ? +(((priceNow - pricePrevM.value)/pricePrevM.value)*100).toFixed(1) : undefined;
    const yoy_pct = priceNow && pricePrevY ? +(((priceNow - pricePrevY.value)/pricePrevY.value)*100).toFixed(1) : undefined;

    return {
      region, period,
      headlineMetrics: {
        price_m2: priceNow,
        mom_pct, yoy_pct,
        mortgage_rate_avg: val("mortgage_rate_avg"),
        issuance_bln: val("mortgage_issuance") ? +(val("mortgage_issuance")!/1e9).toFixed(1) : undefined,
        new_housing_input_th_m2: val("new_housing_input") ? +(val("new_housing_input")!/1e3).toFixed(1) : undefined,
      },
      notableChanges: [
        ...(mom_pct !== undefined ? [{ indicator: "price_m2", deltaPct: mom_pct, refPeriod: prevM }] : []),
        ...(yoy_pct !== undefined ? [{ indicator: "price_m2", deltaPct: yoy_pct, refPeriod: prevY }] : []),
      ].slice(0,3),
    };
  }
}
