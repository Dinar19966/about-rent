import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CbrSource {
  private readonly endpoint = 'https://www.cbr-xml-daily.ru/daily_json.js';

  async getKeyRate(): Promise<number> {
    try {
      const response = await axios.get(this.endpoint);
      const keyRate = response.data?.KeyRate;
      return keyRate || 0;
    } catch (error) {
      console.error('Ошибка при получении ставки ЦБ:', error.message);
      return 0;
    }
  }
}
