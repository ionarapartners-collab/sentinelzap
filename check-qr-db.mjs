/**
 * Check if QR Code is in database
 */
import { drizzle } from 'drizzle-orm/mysql2';
import { chips } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

console.log('🔍 [CHECK] Querying database for chip ID 1...');

const result = await db.select().from(chips).where(eq(chips.id, 1)).limit(1);

if (result.length === 0) {
  console.log('❌ [CHECK] Chip ID 1 not found in database');
} else {
  const chip = result[0];
  console.log('✅ [CHECK] Chip found:', chip.name);
  console.log('📊 [CHECK] Phone:', chip.phoneNumber);
  console.log('📊 [CHECK] Status:', chip.status);
  console.log('📊 [CHECK] Is Connected:', chip.isConnected);
  console.log('📊 [CHECK] QR Code:', chip.qrCode ? `YES (${chip.qrCode.length} chars)` : 'NO');
  
  if (chip.qrCode) {
    console.log('📊 [CHECK] QR Code preview:', chip.qrCode.substring(0, 50) + '...');
  }
}

process.exit(0);
