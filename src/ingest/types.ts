export * from './provided-types'; // положи сюда твои enum/типы из сообщения

export type FetchResult = {
  url: string;
  contentType?: string;
  buffer?: Buffer;    // для CSV/XLSX/PDF
  html?: string;      // для HTML
  text?: string;      // общий текст/JSON
  publishedAt?: string;
};

export type ExtractResult = {
  raw: FetchResult;
  facts: FactRecord[];
};
