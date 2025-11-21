/**
 * List all chips in database
 */
import { drizzle } from 'drizzle-orm/mysql2';
import { chips } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

console.log('🔍 [LIST] Querying all chips from database...');

const result = await db.select().from(chips);

console.log(`📊 [LIST] Found ${result.length} chips:`);
console.log('');

result.forEach((chip, index) => {
  console.log(`${index + 1}. Chip ID: ${chip.id}`);
  console.log(`   Name: ${chip.name}`);
  console.log(`   Phone: ${chip.phoneNumber}`);
  console.log(`   Session ID: ${chip.sessionId}`);
  console.log(`   Status: ${chip.status}`);
  console.log(`   Connected: ${chip.isConnected}`);
  console.log(`   QR Code: ${chip.qrCode ? `YES (${chip.qrCode.length} chars)` : 'NO'}`);
  console.log('');
});

process.exit(0);
