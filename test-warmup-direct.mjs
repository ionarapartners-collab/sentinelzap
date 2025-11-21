#!/usr/bin/env node
/**
 * Direct Warmup Test Script
 * Calls warmup function DIRECTLY without HTTP/authentication
 * 
 * Usage: npx tsx test-warmup-direct.mjs
 */

import { drizzle } from 'drizzle-orm/mysql2';
import { chips } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';
import { processWarmupMessages } from './server/lib/warmup-automation.ts';

const db = drizzle(process.env.DATABASE_URL);

console.log('🔥 DIRECT WARMUP TEST SCRIPT');
console.log('='.repeat(50));
console.log('');

// Get all chips in warmup
console.log('📋 Fetching chips in warmup...');
const chipsInWarmup = await db
  .select()
  .from(chips)
  .where(eq(chips.warmupStatus, 'in_progress'));

console.log(`✅ Found ${chipsInWarmup.length} chips in warmup:\n`);

if (chipsInWarmup.length === 0) {
  console.log('❌ No chips in warmup status!');
  console.log('💡 Chips need to have warmupStatus = "in_progress" to receive warmup messages');
  process.exit(1);
}

// Display chips
for (const chip of chipsInWarmup) {
  console.log(`  📱 ${chip.name} (${chip.phoneNumber})`);
  console.log(`     Status: ${chip.status}`);
  console.log(`     Connected: ${chip.isConnected ? '✅' : '❌'}`);
  console.log(`     Warmup Phase: ${chip.warmupPhase || 'Not set'}`);
  console.log('');
}

console.log('='.repeat(50));
console.log('🚀 SENDING WARMUP MESSAGES DIRECTLY...');
console.log('='.repeat(50));
console.log('');

let successCount = 0;
let errorCount = 0;

for (const chip of chipsInWarmup) {
  console.log(`📤 Processing chip: ${chip.name}...`);
  
  try {
    await processWarmupMessages(chip.id);
    console.log(`   ✅ Success!`);
    successCount++;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    errorCount++;
  }
  
  console.log('');
}

console.log('='.repeat(50));
console.log('📊 RESULTS:');
console.log('='.repeat(50));
console.log(`✅ Successful: ${successCount}`);
console.log(`❌ Failed: ${errorCount}`);
console.log('');
console.log('='.repeat(50));
console.log('✅ Script completed');
console.log('='.repeat(50));

process.exit(0);
