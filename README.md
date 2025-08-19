# about-rent — v2 (переписанная версия)

Минимально-жизнеспособный каркас для **сбора числовых фактов** о рынке и генерации **коротких статей** на их основе.
Акценты: один ORM (**Prisma**), строгая дедупликация, узкий промпт, валидация JSON, безопасный рендер.

## Что внутри
- **NestJS 10**: `Facts`, `Ingest`, `Write` модули.
- **Prisma**: `Fact` (уникальный индекс по `(source, indicator, region, period)`), `Article`.
- **Cron** (04:00 по `TIMEZONE`): каркас ingest-джобы (подключите реальные источники в `SourceRegistry`).
- **OpenRouter**: компактный запрос (только `FactSlice`), строгий JSON-ответ с проверкой Zod.
- **Безопасный рендер**: Markdown → HTML через `marked` + `DOMPurify` (пример в `renderer.ts`).

## Быстрый старт
```bash
cp .env.example .env
# отредактируйте DATABASE_URL и OPENROUTER_API_KEY

npm i
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
# затем GET http://localhost:3000/write/region-brief?region=RU-MOW&period=2025-07