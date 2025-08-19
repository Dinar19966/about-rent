import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HttpClient {
  private client: AxiosInstance = axios.create({
    timeout: 15000,
    maxContentLength: 2_000_000,
    headers: { 'User-Agent': 'about-rent/1.0' },
  });

  async get<T=any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    for (let i = 0; i < 2; i++) {
      try {
        const res = await this.client.get<T>(url, config);
        return res.data;
      } catch (e) {
        if (i === 1) throw e;
        await new Promise(r => setTimeout(r, 500));
      }
    }
    throw new Error('http get failed');
  }
}
