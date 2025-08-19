import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Seed minimal facts for demo
  const now = new Date().toISOString();
  await prisma.fact.upsert({
    where: { uniq_fact_key: { source: 'demo', indicator: 'price_m2', region: 'RU-MOW', period: '2025-07' } },
    update: { value: 365000, unit: 'RUB_M2', fetchedAt: new Date(now) },
    create: { source: 'demo', indicator: 'price_m2', region: 'RU-MOW', period: '2025-07', value: 365000, unit: 'RUB_M2', fetchedAt: new Date(now) },
  });
  await prisma.fact.upsert({
    where: { uniq_fact_key: { source: 'demo', indicator: 'price_m2', region: 'RU-MOW', period: '2025-06' } },
    update: { value: 360000, unit: 'RUB_M2', fetchedAt: new Date(now) },
    create: { source: 'demo', indicator: 'price_m2', region: 'RU-MOW', period: '2025-06', value: 360000, unit: 'RUB_M2', fetchedAt: new Date(now) },
  });
  console.log('Seeded demo facts.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});