import cron from 'node-cron';
import { getDb } from './db';
import { chips } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { processWarmupMessages } from "./lib/warmup-automation";

/**
 * Initialize todos os cron jobs
 */
export function initializeScheduler() {
    console.log('[Scheduler] Initializing cron jobs...');
    
    // Aquecimento automático a cada 3 horas
    cron.schedule('0 */3 * * *', async () => {
        console.log('[Scheduler] Running warmup job...');
        try {
            const db = await getDb();
            if (!db) return;
            
            const chipsInWarmup = await db
                .select()
                .from(chips)
                .where(eq(chips.warmupStatus, 'in_progress'));
            
            console.log(`[Scheduler] Found ${chipsInWarmup.length} chips in warmup`);
            
            for (const chip of chipsInWarmup) {
                try {
                    console.log(`[Scheduler] Processing warmup for chip ${chip.id}`);
                    await processWarmupMessages(chip.id);
                } catch (error) {
                    console.error(`[Scheduler] Error processing warmup for chip ${chip.id}:`, error);
                }
            }
        } catch (error) {
            console.error('[Scheduler] Error in warmup job:', error);
        }
    });

    // Reset contador diário à meia-noite
    cron.schedule('0 0 * * *', async () => {
        console.log('[Scheduler] Resetting daily message counters...');
        try {
            const db = await getDb();
            if (!db) return;

            await db.update(chips)
                .set({ dailyMessageCount: 0 });

            console.log('[Scheduler] ✅ Daily counters reset');
        } catch (error) {
            console.error('[Scheduler] Error resetting counters:', error);
        }
    });

    // Decaimento de risco a cada hora
    cron.schedule('0 * * * *', async () => {
        console.log('[Scheduler] Running risk decay...');
        try {
            const db = await getDb();
            if (!db) return;

            const allChips = await db.select().from(chips);

            for (const chip of allChips) {
                const currentRisk = chip.riskScore || 0;
                const newRisk = Math.max(0, currentRisk - 3); // Decai 3 pontos por hora

                if (currentRisk !== newRisk) {
                    await db.update(chips)
                        .set({ riskScore: newRisk })
                        .where(eq(chips.id, chip.id));
                }
            }

            console.log('[Scheduler] ✅ Risk decay completed');
        } catch (error) {
            console.error('[Scheduler] Error in risk decay:', error);
        }
    });

    console.log('[Scheduler] ✅ All cron jobs initialized');
}