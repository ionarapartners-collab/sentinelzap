/**
 * Test script to call initializeSession directly
 */
import { initializeSession } from './server/whatsapp.ts';

console.log('🔧 [TEST] Testing initializeSession function directly...');
console.log('🔧 [TEST] Calling initializeSession(1)...');

const result = await initializeSession(1);

console.log('📊 [TEST] Result:', JSON.stringify(result, null, 2));

if (result.success && result.qrCode) {
  console.log('✅ [TEST] SUCCESS! QR Code generated');
  console.log('📊 [TEST] QR Code length:', result.qrCode.length);
  console.log('📊 [TEST] QR Code preview:', result.qrCode.substring(0, 50) + '...');
} else {
  console.error('❌ [TEST] FAILED!', result.error || 'No QR Code');
}

// Keep process alive for 65 seconds to allow QR code generation
console.log('⏳ [TEST] Waiting 65 seconds for QR code generation...');
await new Promise(resolve => setTimeout(resolve, 65000));

console.log('✅ [TEST] Test completed');
process.exit(0);
