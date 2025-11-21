#!/usr/bin/env node
/**
 * Manual Warmup Test Script
 * Run this script to test warmup messages WITHOUT restarting the server
 * 
 * Usage: npx tsx test-warmup-manual.mjs
 */

import { drizzle } from 'drizzle-orm/mysql2';
import { chips } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

console.log('🔥 MANUAL WARMUP TEST SCRIPT');
console.log('=' .repeat(50));
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

console.log('=' .repeat(50));
console.log('🚀 SENDING WARMUP MESSAGES VIA HTTP API...');
console.log('=' .repeat(50));
console.log('');

// Call the tRPC endpoint via HTTP
try {
  const response = await fetch('http://localhost:3000/api/trpc/warmup.sendWarmupNow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Note: This will fail if authentication is required
      // For testing purposes, we'll try anyway
    },
    body: JSON.stringify({}),
  });

  const result = await response.json();
  
  if (response.ok) {
    console.log('✅ SUCCESS!');
    console.log('');
    console.log(`📊 Result: ${result.result?.data?.message || 'Messages sent'}`);
    console.log(`   Success: ${result.result?.data?.successCount || 0}`);
    console.log(`   Failed: ${result.result?.data?.errorCount || 0}`);
  } else {
    console.log('❌ FAILED!');
    console.log('');
    console.log('Error:', result.error?.message || 'Unknown error');
    
    if (result.error?.message?.includes('UNAUTHORIZED')) {
      console.log('');
      console.log('💡 TIP: This script needs authentication.');
      console.log('   Use the button in the web interface instead:');
      console.log('   → /dashboard/warmup → "Enviar Aquecimento Agora"');
    }
  }
} catch (error) {
  console.log('❌ HTTP REQUEST FAILED!');
  console.log('');
  console.log('Error:', error.message);
  console.log('');
  console.log('💡 Make sure the server is running on port 3000');
}

console.log('');
console.log('=' .repeat(50));
console.log('✅ Script completed');
console.log('=' .repeat(50));

process.exit(0);
