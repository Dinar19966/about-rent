import dayjs from "dayjs";
import crypto from "crypto";
import { FactRecord } from "../../common/facts.types";

// CSV: period,region,price_m2,mortgage_rate
export async function mapCsv(rows: any[]): Promise<FactRecord[]> {
  const out: FactRecord[] = [];
  const fetchedAt = new Date().toISOString();

  for (const r of rows) {
    const period = dayjs(String(r.period)).format("YYYY-MM");
    const region = String(r.region || "RU-MOW");
    if (r.price_m2) {
      out.push({
        id: crypto.randomUUID(),
        source: "CIAN_MARKET_CSV",
        indicator: "price_m2",
        region, period, value: Math.round(Number(r.price_m2)/100)*100, unit: "RUB_M2",
        fetchedAt,
      });
    }
    if (r.mortgage_rate) {
      out.push({
        id: crypto.randomUUID(),
        source: "CIAN_MARKET_CSV",
        indicator: "mortgage_rate_avg",
        region, period, value: Math.round(Number(r.mortgage_rate)*10)/10, unit: "PCT",
        fetchedAt,
      });
    }
  }
  return out;
}
