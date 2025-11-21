import { drizzle } from 'drizzle-orm/mysql2';
import { chips } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

console.log('🔍 Checking warmup status...\n');

const allChips = await db.select().from(chips);

for (const chip of allChips) {
  console.log(`Chip: ${chip.name}`);
  console.log(`  warmupStatus: ${chip.warmupStatus || 'NULL'}`);
  console.log(`  warmupPhase: ${chip.warmupPhase || 'NULL'}`);
  console.log(`  warmupStartDate: ${chip.warmupStartDate || 'NULL'}`);
  console.log('');
}

process.exit(0);
