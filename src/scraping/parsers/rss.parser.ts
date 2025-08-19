import Parser from 'rss-parser';
import { RawItem } from '../../common/types';

const parser = new Parser();

export async function parseRss(sourceKey: string, url: string): Promise<RawItem[]> {
  const feed = await parser.parseURL(url);
  return (feed.items || []).map((i) => ({
    sourceKey,
    url: i.link || '',
    title: i.title || '',
    description: i.contentSnippet || i.content || i.summary || undefined,
    publishedAt: i.isoDate ? new Date(i.isoDate) : undefined,
  }));
}
