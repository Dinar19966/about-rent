import dayjs from 'dayjs';
import { createHash } from 'crypto';

export const normText = (s?: string) =>
  (s || '').replace(/\s+/g, ' ').trim();

export const iso = (d?: Date | string) =>
  d ? dayjs(d).toISOString() : undefined;

export const sha1 = (s: string) =>
  createHash('sha1').update(s).digest('hex');
