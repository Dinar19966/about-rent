import axios, { AxiosInstance } from 'axios';
import { Injectable } from '@nestjs/common';

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

@Injectable()
export class HttpClient {
  private client: AxiosInstance;
  private perHostInFlight = new Map<string, number>();

  constructor() {
    this.client = axios.create({ timeout: 15000, maxContentLength: 2_000_000 });
    this.client.interceptors.request.use(cfg => {
      cfg.headers = {
        ...cfg.headers,
        'User-Agent': 'about-rent-bot/2.0 (+https://github.com/Dinar19966/about-rent)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      };
      return cfg;
    });
  }

  private hostFrom(url: string) {
    try { return new URL(url).host; } catch { return 'unknown'; }
  }

  async get(url: string, opts?: { etag?: string; lastModified?: string; headers?: Record<string,string> }) {
    const host = this.hostFrom(url);
    // Simple per-host rate limiting: max 4 in flight
    while ((this.perHostInFlight.get(host) ?? 0) >= 4) {
      await sleep(200);
    }
    this.perHostInFlight.set(host, (this.perHostInFlight.get(host) ?? 0) + 1);
    try {
      const headers: Record<string,string> = { ...(opts?.headers ?? {}) };
      if (opts?.etag) headers['If-None-Match'] = opts.etag;
      if (opts?.lastModified) headers['If-Modified-Since'] = opts.lastModified;
      const res = await this.client.get(url, { headers, validateStatus: s => [200,304].includes(s) });
      return res;
    } finally {
      this.perHostInFlight.set(host, Math.max(0, (this.perHostInFlight.get(host) ?? 1) - 1));
    }
  }
}