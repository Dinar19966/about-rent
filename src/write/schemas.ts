import { z } from 'zod';

export const ArticleSchema = z.object({
  title: z.string().min(10).max(120),
  bullets: z.array(z.string().min(5)).min(3).max(5),
  conclusion: z.string().min(20).max(240),
});

export type ArticleJSON = z.infer<typeof ArticleSchema>;