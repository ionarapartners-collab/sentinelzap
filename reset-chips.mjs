import { drizzle } from 'drizzle-orm/mysql2';
import { chips } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

console.log('🔄 Resetting all chips to offline...');

await db.update(chips).set({ 
  status: 'offline', 
  isConnected: false,
  qrCode: null 
});

console.log('✅ All chips reset to offline');
process.exit(0);
