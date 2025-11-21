/**
 * Test script to verify Baileys QR Code generation
 */
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pino({ level: 'info' });

async function testBaileys() {
  console.log('🔧 [TEST] Starting Baileys QR Code test...');

  try {
    // Create auth directory
    const authDir = path.join(__dirname, 'tokens', 'test-session');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
      console.log('✅ [TEST] Auth directory created:', authDir);
    }

    // Load auth state
    console.log('🔧 [TEST] Loading auth state...');
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    console.log('✅ [TEST] Auth state loaded');

    // Get latest Baileys version
    console.log('🔧 [TEST] Fetching latest Baileys version...');
    const { version } = await fetchLatestBaileysVersion();
    console.log('✅ [TEST] Baileys version:', version);

    // Create QR code promise
    let qrCodeReceived = false;
    let connectionOpened = false;

    // Create WhatsApp socket
    console.log('🔧 [TEST] Creating WASocket...');
    const sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: true, // Print QR in terminal for testing
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      browser: ['SentinelZap-Test', 'Chrome', '120.0.0'],
      generateHighQualityLinkPreview: true,
    });
    console.log('✅ [TEST] WASocket created');

    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
      console.log('🔔 [TEST] connection.update event:', JSON.stringify(update, null, 2));
      
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('✅ [TEST] QR Code received!');
        console.log('📊 [TEST] QR Code length:', qr.length);
        console.log('📊 [TEST] QR Code preview:', qr.substring(0, 50) + '...');
        qrCodeReceived = true;
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('❌ [TEST] Connection closed. Should reconnect:', shouldReconnect);
        
        if (lastDisconnect?.error) {
          console.error('❌ [TEST] Error:', lastDisconnect.error);
        }
        
        process.exit(qrCodeReceived ? 0 : 1);
      } else if (connection === 'open') {
        console.log('✅ [TEST] Connection opened!');
        connectionOpened = true;
        
        // Exit after successful connection
        setTimeout(() => {
          console.log('✅ [TEST] Test completed successfully!');
          process.exit(0);
        }, 2000);
      }
    });

    // Handle credentials update
    sock.ev.on('creds.update', saveCreds);

    // Timeout after 60 seconds
    setTimeout(() => {
      if (!qrCodeReceived && !connectionOpened) {
        console.error('❌ [TEST] Timeout: No QR Code or connection after 60 seconds');
        process.exit(1);
      }
    }, 60000);

    console.log('⏳ [TEST] Waiting for QR Code or connection... (max 60s)');
  } catch (error) {
    console.error('❌ [TEST] Error:', error);
    process.exit(1);
  }
}

testBaileys();
