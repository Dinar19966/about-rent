import { JSDOM } from 'jsdom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export function renderMarkdownToHTML(md: string) {
  const window = new JSDOM('').window as any;
  const purify = DOMPurify(window);
  const dirty = marked.parse(md);
  const clean = purify.sanitize(String(dirty));
  return clean;
}