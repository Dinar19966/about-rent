import { Injectable } from "@nestjs/common";
import type { FactRecord, RuRealEstateSource } from "../common/facts.types";

export type SourceRule = {
  id: RuRealEstateSource;
  discovery: { type: "RSS" | "INDEX" | "DIRECT"; url: string; };
  fetch: Array<
    | { kind: "CSV"; url: string; }
    | { kind: "HTML_TABLE"; url: string; selectors: { table: string; date?: string; } }
    | { kind: "XLSX"; url: string; sheet?: string; }
  >;
  mapper: (raw: any) => Promise<FactRecord[]>;
  cadence: "daily" | "weekly" | "monthly" | "quarterly" | "ad-hoc";
};

@Injectable()
export class SourceRegistry {
  private readonly rules: SourceRule[] = [];

  constructor() {
    // пример CSV-источника (заглушка под учебку)
    this.rules.push({
      id: "CIAN_MARKET_CSV",
      discovery: { type: "DIRECT", url: "https://example.com/market.csv" },
      fetch: [{ kind: "CSV", url: "https://example.com/market.csv" }],
      mapper: async (raw) => (await import("../parser/mappers/example.csv")).mapCsv(raw),
      cadence: "monthly",
    });
  }

  all() { return this.rules; }
}
