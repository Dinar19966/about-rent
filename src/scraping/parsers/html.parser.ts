import axios from 'axios';
import { RawItem } from '../../common/types';
import { parse } from 'node-html-parser';

type Meta =
  | {
      item: string;
      title?: string | ((el: any) => string | undefined);
      href?: string | ((el: any) => string | undefined);
      description?: string | null | ((el: any) => string | undefined);
      date?: string | null | ((el: any) => string | undefined);
      transformUrl?: (href: string) => string;
    }
  | undefined;

export async function parseHtml(sourceKey: string, url: string, meta: Meta): Promise<RawItem[]> {
  const { data } = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (content aggregator bot)' } });
  const root = parse(data);
  const items = root.querySelectorAll(meta?.item || 'article, a');

  const getText = (el: any, sel?: string | ((el: any) => string | undefined)) => {
    if (!sel) return undefined;
    if (typeof sel === 'function') return sel(el);
    const n = el.querySelector(sel);
    return n?.text?.trim();
  };
  const getHref = (el: any, sel?: string | ((el: any) => string | undefined)) => {
    if (!sel) return undefined;
    if (typeof sel === 'function') return sel(el);
    const n = el.querySelector(sel);
    return n?.getAttribute('href') || undefined;
  };

  const list: RawItem[] = [];
  for (const el of items.slice(0, 50)) {
    const title = getText(el, meta?.title) || el.getAttribute('title') || el.text?.trim();
    let href = getHref(el, meta?.href) || el.getAttribute('href');
    if (!href || !title) continue;
    if (meta?.transformUrl) href = meta.transformUrl(href);
    if (!href.startsWith('http')) continue;
    list.push({ sourceKey, url: href, title });
  }
  return list;
}
