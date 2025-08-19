import { Injectable } from '@nestjs/common';

export type FetchRule =
  | { kind: 'CSV'; url: string; }
  | { kind: 'HTML_TABLE'; url: string; selectors: { table: string; date?: string; } }
  | { kind: 'XLSX'; url: string; sheet?: string; }
  | { kind: 'PDF_TABLE'; url: string; pages?: number[]; };

export type SourceRule = {
  id: string;
  discovery: { type: 'DIRECT' | 'RSS' | 'INDEX'; url: string; };
  fetch: FetchRule[];
  mapper: (raw: unknown) => Array<{
    source: string; indicator: string; region: string; period: string; value: number; unit: 'RUB_M2' | 'PCT' | 'UNITS' | 'RUB' | 'BPS'; meta?: Record<string,string>; src?: string;
  }>;
  cadence: 'daily' | 'weekly' | 'monthly' | 'ad-hoc';
};

@Injectable()
export class SourceRegistry {
  // For demo purposes, we provide a single DIRECT "demo" source (seeded facts cover it).
  private rules: SourceRule[] = [
    {
      id: 'demo',
      discovery: { type: 'DIRECT', url: 'https://example.com/demo' },
      fetch: [], // nothing to fetch; use seed or manual import
      mapper: () => [],
      cadence: 'monthly',
    },
  ];

  all() { return this.rules; }
}