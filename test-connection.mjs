import { drizzle } from 'drizzle-orm/mysql2';
import { chips } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

console.log('🔍 Checking connected chips...');

const connectedChips = await db.select().from(chips);

console.log(`\n📊 Found ${connectedChips.length} chips:\n`);

for (const chip of connectedChips) {
  console.log(`Chip: ${chip.name}`);
  console.log(`  ID: ${chip.id}`);
  console.log(`  Phone: ${chip.phoneNumber}`);
  console.log(`  Session ID: ${chip.sessionId}`);
  console.log(`  Status: ${chip.status}`);
  console.log(`  Connected: ${chip.isConnected}`);
  console.log('');
}

process.exit(0);
