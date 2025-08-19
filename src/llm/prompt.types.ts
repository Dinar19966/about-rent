import { ArticleTemplate, FactSlice } from "../common/facts.types";

export type ArticlePrompt = {
  template: ArticleTemplate;
  locale: "ru-RU";
  tone: "neutral" | "optimistic" | "dry";
  audience: "mass" | "pro";
  region: string;
  period: string;
  slice: FactSlice;
  wordTarget: 120 | 150 | 180;
};

export type ArticleResult = { title: string; bullets: string[]; conclusion: string; };
