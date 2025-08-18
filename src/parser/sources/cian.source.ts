import { Injectable } from '@nestjs/common';

@Injectable()
export class CianSource {
  async getRentInfo(): Promise<string> {
    // Заглушка, потом заменим на реальный парсинг
    const delta = 12;
    return `+${delta}% за квартал (данные ЦИАН, аренда 1-к)`;
  }
}
