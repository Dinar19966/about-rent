import { Injectable } from '@nestjs/common';
import { CbrSource } from './sources/cbr.source';
import { CianSource } from './sources/cian.source';
import { NewsSource } from './sources/news.sourse';


export interface MarketData {
  cbrRate: number | null;
  rentInfo: string | null;
  news: string[]; // массив новостей
  date: string;
}

@Injectable()
export class ParserService {
  constructor(
    private readonly cbrSource: CbrSource,
    private readonly cianSource: CianSource,
    private readonly newsSource: NewsSource,
  ) {}

  async getDailyMarketData(): Promise<MarketData> {
    const [cbrRate, rentInfo, news] = await Promise.all([
      this.safeGet(() => this.cbrSource.getKeyRate()),
      this.safeGet(() => this.cianSource.getRentInfo()),
      this.safeGet(() => this.newsSource.getTopNews()),
    ]);

    return {
      cbrRate,
      rentInfo,
      news: news || [],
      date: new Date().toISOString().slice(0, 10),
    };
  }

  // Универсальный обработчик ошибок для источников
  private async safeGet<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch {
      return null;
    }
  }
}
