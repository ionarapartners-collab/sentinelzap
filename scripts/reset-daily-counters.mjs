import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { chips } from "../drizzle/schema.js";

/**
 * Script para resetar contadores diários de todos os chips
 * Deve ser executado via cron job à meia-noite
 */
async function resetDailyCounters() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [Cron] Starting daily counters reset...`);
  
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL not found in environment variables");
    }

    const db = drizzle(process.env.DATABASE_URL);
    
    // Reset daily counters and risk scores
    const result = await db.update(chips).set({
      messagesSentToday: 0,
      currentRiskScore: 0,
      status: "active",
      pausedReason: null,
    });
    
    console.log(`[${timestamp}] [Cron] Daily counters reset successfully!`);
    console.log(`[${timestamp}] [Cron] Affected rows: ${result.rowsAffected || 0}`);
    
    process.exit(0);
  } catch (error) {
    console.error(`[${timestamp}] [Cron] Error resetting counters:`, error);
    process.exit(1);
  }
}

resetDailyCounters();
