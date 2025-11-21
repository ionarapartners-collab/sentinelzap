/**
 * Restore WhatsApp sessions on server startup
 */
import { getDb } from './db';
import { chips } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { initializeSession } from './whatsapp';

export async function restoreSessions() {
  console.log('[Restore] 🔄 Restoring WhatsApp sessions...');
  
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[Restore] ⚠️ Database not available, skipping session restore');
      return;
    }

    // ✅ HOTFIX: Verificar se o banco está realmente disponível
    try {
      // Teste simples de conexão com o banco
      await db.select().from(chips).limit(1);
    } catch (dbError) {
      console.warn('[Restore] ⚠️ Database connection failed, skipping session restore:', dbError.message);
      return;
    }

    // Get all connected chips
    const connectedChips = await db
      .select()
      .from(chips)
      .where(eq(chips.isConnected, true));

    console.log(`[Restore] Found ${connectedChips.length} connected chips to restore`);

    // Se não há chips conectados, sair
    if (connectedChips.length === 0) {
      console.log('[Restore] ✅ No connected chips to restore');
      return;
    }

    // Restore each session with delay to avoid conflicts
    for (let i = 0; i < connectedChips.length; i++) {
      const chip = connectedChips[i];
      console.log(`[Restore] 🔧 Restoring session for chip: ${chip.name} (ID: ${chip.id}) [${i + 1}/${connectedChips.length}]`);
      
      try {
        // Initialize session (will load saved credentials from tokens/)
        const result = await initializeSession(chip.id);
        
        if (result.success) {
          console.log(`[Restore] ✅ Session restored for chip: ${chip.name}`);
        } else {
          console.error(`[Restore] ❌ Failed to restore session for chip: ${chip.name}`, result.error);
          
          // Don't update status - let user reconnect manually
          console.log(`[Restore] ⚠️ Chip ${chip.name} needs manual reconnection`);
        }
      } catch (error) {
        console.error(`[Restore] ❌ Error restoring session for chip: ${chip.name}`, error);
        
        // Don't update status - let user reconnect manually
        console.log(`[Restore] ⚠️ Chip ${chip.name} needs manual reconnection`);
      }
      
      // Wait 3 seconds before next chip (queue handles this internally)
      if (i < connectedChips.length - 1) {
        console.log(`[Restore] ⏳ Waiting 3s before next chip...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    console.log('[Restore] ✅ Session restore completed');
  } catch (error) {
    console.error('[Restore] ❌ Error during session restore:', error);
  }
}