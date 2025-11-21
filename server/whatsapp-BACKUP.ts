import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  type WASocket,
  type ConnectionState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { getDb } from './db';
import { chips } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import { sessionQueue } from './session-queue';

// Store active WhatsApp clients
const clients = new Map<string, WASocket>();

// Store QR codes temporarily (in memory)
const qrCodes = new Map<string, string>();

// Logger
const logger = pino({ level: 'debug' }); // Set to 'debug' for debugging

/**
 * Initialize WhatsApp session and generate QR Code
 */
export async function initializeSession(chipId: number): Promise<
  | { success: true; qrCode: string; message: string }
  | { success: false; error: string }
> {
  // Use queue to prevent concurrent initializations
  return sessionQueue.add(chipId, async () => {
    return await _initializeSessionInternal(chipId);
  });
}

async function _initializeSessionInternal(chipId: number): Promise<
  | { success: true; qrCode: string; message: string }
  | { success: false; error: string }
> {
  try {
    const sessionId = `chip-${chipId}`;
    console.log(`[WhatsApp] Initializing session for: ${sessionId}`);

    // Check if client already exists
    if (clients.has(sessionId)) {
      console.log(`[WhatsApp] Client already exists for: ${sessionId}`);
      const existingQR = qrCodes.get(sessionId);
      if (existingQR) {
        return { success: true, qrCode: existingQR, message: 'QR Code já gerado' };
      }
    }

    // Create auth directory
    const authDir = path.join(process.cwd(), 'tokens', sessionId);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    // Load auth state
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    // Get latest Baileys version
    const { version } = await fetchLatestBaileysVersion();

    // Create QR code promise
    let qrCodeResolve: ((qr: string) => void) | null = null;
    const qrCodePromise = new Promise<string>((resolve) => {
      qrCodeResolve = resolve;
    });

    // Create WhatsApp socket
    console.log(`[WhatsApp] 🔧 Creating WASocket for ${sessionId}...`);
    const sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      browser: ['SentinelZap', 'Chrome', '120.0.0'],
      generateHighQualityLinkPreview: true,
    });
    console.log(`[WhatsApp] ✅ WASocket created successfully for ${sessionId}`);

    // Handle QR code
    sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
      console.log(`[WhatsApp] 🔔 connection.update event for ${sessionId}:`, JSON.stringify(update, null, 2));
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log(`[WhatsApp] ✅ QR Code generated for session: ${sessionId}`);
        console.log(`[WhatsApp] QR Code length: ${qr.length}`);
        
        // Store QR code
        qrCodes.set(sessionId, qr);
        
        // Save to database
        const db = await getDb();
        if (db) {
          await db.update(chips)
            .set({ qrCode: qr, status: 'offline' })
            .where(eq(chips.id, chipId));
          console.log(`[WhatsApp] QR Code saved to database for chip: ${chipId}`);
        }
        
        // Resolve promise
        if (qrCodeResolve) {
          qrCodeResolve(qr);
        }
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`[WhatsApp] Connection closed for ${sessionId}. Status: ${statusCode}, Reconnect: ${shouldReconnect}`);
        
        // ✅ CORREÇÃO CRÍTICA: Detecção de banimento
        if (statusCode === 428) { // Código de spam detectado
          console.error(`[WhatsApp] 🚨 SPAM DETECTED! Chip ${chipId} was banned!`);
          const db = await getDb();
          if (db) {
            await db.update(chips)
              .set({ 
                status: 'error', 
                qrCode: null, 
                isConnected: false,
                warmupStatus: 'paused',
                riskScore: 100 
              })
              .where(eq(chips.id, chipId));
            console.log(`[WhatsApp] ✅ Chip ${chipId} automatically paused due to ban`);
          }
        } else {
          // Only mark as error if it's a logout (user action)
          const db = await getDb();
          if (db) {
            const newStatus = statusCode === DisconnectReason.loggedOut ? 'offline' : 'error';
            await db.update(chips)
              .set({ status: newStatus, qrCode: null, isConnected: false })
              .where(eq(chips.id, chipId));
          }
        }
        
        // Remove from active clients
        clients.delete(sessionId);
        qrCodes.delete(sessionId);
        
        // Auto-reconnect disabled to prevent infinite loops
        // User must manually reconnect via UI
        console.log(`[WhatsApp] ⚠️ Auto-reconnect disabled for ${sessionId}`);
      } else if (connection === 'open') {
        console.log(`[WhatsApp] ✅ Connection opened for session: ${sessionId}`);
        
        // Update status
        const db = await getDb();
        if (db) {
          await db.update(chips)
            .set({ status: 'active', qrCode: null, isConnected: true })
            .where(eq(chips.id, chipId));
        }
        
        // Clear QR code
        qrCodes.delete(sessionId);
      }
    });

    // Handle credentials update
    sock.ev.on('creds.update', saveCreds);

    // Store client
    clients.set(sessionId, sock);

    // Wait for QR code (with timeout)
    const qrCode = await Promise.race([
      qrCodePromise,
      new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error('QR Code generation timeout')), 60000)
      ),
    ]);

    return {
      success: true,
      qrCode,
      message: 'QR Code gerado com sucesso!',
    };
  } catch (error: unknown) {
    console.error('[WhatsApp] Error initializing session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Erro ao inicializar sessão: ${errorMessage}`,
    };
  }
}

/**
 * ✅ CORREÇÃO CRÍTICA: Valida se número existe no WhatsApp
 */
export async function validateWhatsAppNumber(
  chipId: number, 
  phoneNumber: string
): Promise<{ exists: boolean; valid: boolean }> {
  try {
    const sessionId = `chip-${chipId}`;
    const client = clients.get(sessionId);
    
    if (!client) {
      console.log(`[Validation] Client not found for chip ${chipId}`);
      return { exists: false, valid: false };
    }
    
    // Formata número para padrão internacional
    const formattedNumber = phoneNumber.replace(/\D/g, '');
    const jid = `${formattedNumber}@s.whatsapp.net`;
    
    console.log(`[Validation] Validating number: ${formattedNumber}`);
    
    // Verifica se número existe no WhatsApp
    const [result] = await client.onWhatsApp(jid);
    const exists = result?.exists || false;
    
    console.log(`[Validation] Number ${formattedNumber} exists: ${exists}`);
    
    return { 
      exists: exists,
      valid: exists // Para compatibilidade com código antigo
    };
    
  } catch (error) {
    console.error(`[Validation] Error validating number ${phoneNumber}:`, error);
    return { exists: false, valid: false };
  }
}

/**
 * Send a message via WhatsApp COM VALIDAÇÃO
 */
export async function sendMessage(
  chipId: number,
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const sessionId = `chip-${chipId}`;
    const client = clients.get(sessionId);

    if (!client) {
      return { success: false, error: 'Sessão não encontrada. Conecte o chip primeiro.' };
    }

    // ✅ CORREÇÃO CRÍTICA: Valida número antes de enviar
    console.log(`[WhatsApp] Validating recipient: ${phoneNumber}`);
    const validation = await validateWhatsAppNumber(chipId, phoneNumber);
    
    if (!validation.exists) {
      const errorMsg = `Número inválido no WhatsApp: ${phoneNumber}`;
      console.log(`[WhatsApp] ❌ ${errorMsg}`);
      return { success: false, error: errorMsg };
    }

    console.log(`[WhatsApp] ✅ Number validated: ${phoneNumber}`);

    // Format phone number (remove non-digits and add @s.whatsapp.net)
    const formattedNumber = phoneNumber.replace(/\D/g, '') + '@s.whatsapp.net';

    // Send message
    const result = await client.sendMessage(formattedNumber, { text: message });

    console.log(`[WhatsApp] ✅ Message sent from ${sessionId} to ${phoneNumber}`);

    return {
      success: true,
      messageId: result?.key?.id || 'unknown',
    };
  } catch (error: unknown) {
    console.error('[WhatsApp] Error sending message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Erro ao enviar mensagem: ${errorMessage}`,
    };
  }
}

/**
 * Check if a session is active
 */
export function isSessionActive(chipId: number): boolean {
  const sessionId = `chip-${chipId}`;
  return clients.has(sessionId);
}

/**
 * Disconnect a session
 */
export async function disconnectSession(chipId: number): Promise<void> {
  const sessionId = `chip-${chipId}`;
  const client = clients.get(sessionId);

  if (client) {
    await client.logout();
    clients.delete(sessionId);
    qrCodes.delete(sessionId);
    console.log(`[WhatsApp] Session disconnected: ${sessionId}`);
  }

  // Update database
  const db = await getDb();
  if (db) {
    await db.update(chips)
      .set({ status: 'offline', qrCode: null, isConnected: false })
      .where(eq(chips.id, chipId));
  }
}

/**
 * Get QR Code for a session (from memory or database)
 */
export async function getQRCode(chipId: number): Promise<string | null> {
  const sessionId = `chip-${chipId}`;
  
  // Check memory first
  const qr = qrCodes.get(sessionId);
  if (qr) {
    console.log(`[WhatsApp] QR Code found in memory for: ${sessionId}`);
    return qr;
  }

  // Check database
  const db = await getDb();
  if (db) {
    const result = await db.select().from(chips).where(eq(chips.id, chipId)).limit(1);
    if (result.length > 0 && result[0].qrCode) {
      console.log(`[WhatsApp] QR Code found in database for chip: ${chipId}`);
      return result[0].qrCode;
    }
  }

  console.log(`[WhatsApp] No QR Code found for: ${sessionId}`);
  return null;
}