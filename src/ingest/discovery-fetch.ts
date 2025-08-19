import axios from "axios";
import * as cheerio from "cheerio";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { SourceRule } from "../config/sources.registry";

export type DiscoveredItem = { url: string; kind: "CSV"|"HTML_TABLE"|"XLSX"; etag?: string; lastModified?: string; };

export async function discover(rule: SourceRule): Promise<DiscoveredItem[]> {
  // для учебки: DIRECT → сразу возвращаем fetch-список; RSS/INDEX можно расширить
  return rule.fetch.map(f => ({ url: (f as any).url, kind: f.kind as any }));
}

export async function fetchNarrow(item: DiscoveredItem, rule: SourceRule): Promise<any> {
  const res = await axios.get(item.url, { responseType: "arraybuffer", headers: { "Accept": "*/*" } });

  if (item.kind === "CSV") {
    const text = Buffer.from(res.data).toString("utf8");
    const rows = parse(text, { columns: true, skip_empty_lines: true });
    return rows; // массив объектов-строк
  }

  if (item.kind === "XLSX") {
    const wb = XLSX.read(res.data, { type: "buffer" });
    const sheetName = (rule.fetch.find(f => (f as any).kind === "XLSX") as any)?.sheet ?? wb.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
    return rows;
  }

  if (item.kind === "HTML_TABLE") {
    const html = Buffer.from(res.data).toString("utf8");
    const $ = cheerio.load(html);
    const f = rule.fetch.find(f => (f as any).kind === "HTML_TABLE") as any;
    const table = $(f.selectors.table);
    const rows: string[][] = [];
    table.find("tr").each((_i, tr) => {
      const row: string[] = [];
      $(tr).find("th,td").each((_j, td) => row.push($(td).text().trim()));
      if (row.filter(Boolean).length) rows.push(row);
    });
    const date = f.selectors.date ? $(f.selectors.date).attr("datetime") || $(f.selectors.date).text().trim() : undefined;
    return { rows, date };
  }

  throw new Error("Unsupported kind");
}
