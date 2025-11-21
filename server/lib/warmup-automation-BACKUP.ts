/**
 * Warmup Automation Module
 * 
 * Handles automatic warmup of new WhatsApp chips to prevent bans.
 * Sends automated messages between chips to simulate organic usage.
 */

import { getDb } from "../db";
import { chips, warmupHistory, warmupSettings, type Chip, type InsertWarmupHistory } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendMessage } from "../whatsapp";

/**
 * Warmup message templates - varied messages to simulate real conversations
 */
const WARMUP_MESSAGES = [
  "Oi! Tudo bem?",
  "Bom dia! Como você está?",
  "Boa tarde! Tudo certo por aí?",
  "Oi, tudo bem? Conseguiu ver aquele documento?",
  "Boa noite! Amanhã a gente conversa melhor.",
  "Olá! Vamos marcar aquela reunião?",
  "Oi! Você recebeu meu e-mail?",
  "Tudo bem? Preciso confirmar um detalhe com você.",
  "Oi! Quando você tem um tempinho para conversarmos?",
  "Bom dia! Vamos alinhar aquele projeto hoje?",
  "Boa tarde! Conseguiu revisar o material?",
  "Oi! Podemos conversar sobre aquele assunto?",
  "Olá! Você está disponível agora?",
  "Tudo certo? Preciso de uma ajuda rápida.",
  "Oi! Vamos combinar os detalhes?",
  "Bom dia! Já deu uma olhada no que te mandei?",
  "Boa tarde! Consegue me retornar até amanhã?",
  "Oi! Tudo bem por aí? Novidades?",
  "Olá! Vamos nos falar mais tarde?",
  "Tudo bem? Quando podemos conversar?",
];

/**
 * Get default warmup settings for a user
 */
export async function getWarmupSettings(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const settings = await db
    .select()
    .from(warmupSettings)
    .where(eq(warmupSettings.userId, userId))
    .limit(1);

  if (settings.length === 0) {
    // Create default settings
    const defaultSettings = {
      userId,
      warmupDurationDays: 14,
      phase1MessagesPerDay: 15,
      phase2MessagesPerDay: 40,
      phase3MessagesPerDay: 75,
      phase1Duration: 3,
      phase2Duration: 4,
      phase3Duration: 7,
      blockUnwarmedChips: false,
    };

    await db.insert(warmupSettings).values(defaultSettings);
    return defaultSettings;
  }

  return settings[0];
}

/**
 * Start warmup process for a chip
 */
export async function startWarmup(chipId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const chip = await db.select().from(chips).where(eq(chips.id, chipId)).limit(1);
  if (chip.length === 0) throw new Error("Chip not found");

  const settings = await getWarmupSettings(chip[0].userId);
  const warmupEndDate = new Date();
  warmupEndDate.setDate(warmupEndDate.getDate() + settings.warmupDurationDays);

  await db
    .update(chips)
    .set({
      warmupStatus: "in_progress",
      warmupStartDate: new Date(),
      warmupEndDate,
      warmupCurrentDay: 1,
      warmupMessagesToday: 0,
    })
    .where(eq(chips.id, chipId));

  console.log(`[Warmup] Started warmup for chip ${chipId} (${settings.warmupDurationDays} days)`);
}

/**
 * Stop/skip warmup process for a chip
 */
export async function stopWarmup(chipId: number, markAsCompleted: boolean = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(chips)
    .set({
      warmupStatus: markAsCompleted ? "completed" : "skipped",
      warmupEndDate: new Date(),
    })
    .where(eq(chips.id, chipId));

  console.log(`[Warmup] ${markAsCompleted ? "Completed" : "Skipped"} warmup for chip ${chipId}`);
}

/**
 * Get current warmup phase for a chip based on current day
 */
function getWarmupPhase(currentDay: number, settings: any): { phase: number; messagesPerDay: number } {
  if (currentDay <= settings.phase1Duration) {
    return { phase: 1, messagesPerDay: settings.phase1MessagesPerDay };
  } else if (currentDay <= settings.phase1Duration + settings.phase2Duration) {
    return { phase: 2, messagesPerDay: settings.phase2MessagesPerDay };
  } else {
    return { phase: 3, messagesPerDay: settings.phase3MessagesPerDay };
  }
}

/**
 * Get random warmup message
 */
function getRandomMessage(): string {
  return WARMUP_MESSAGES[Math.floor(Math.random() * WARMUP_MESSAGES.length)];
}

/**
 * Send warmup messages for a specific chip
 * This should be called by the scheduler periodically (e.g., every hour)
 */
export async function processWarmupMessages(chipId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get chip details
  const chipResult = await db.select().from(chips).where(eq(chips.id, chipId)).limit(1);
  if (chipResult.length === 0) return;

  const chip = chipResult[0];

  // Only process chips in warmup
  if (chip.warmupStatus !== "in_progress") return;

  // Check if chip is connected
  if (!chip.isConnected || chip.status !== "active") {
    console.log(`[Warmup] Chip ${chipId} is not connected, skipping warmup messages`);
    return;
  }

  // Get warmup settings
  const settings = await getWarmupSettings(chip.userId);
  const { phase, messagesPerDay } = getWarmupPhase(chip.warmupCurrentDay, settings);

  // Check if we've already sent enough messages today
  if (chip.warmupMessagesToday >= messagesPerDay) {
    console.log(`[Warmup] Chip ${chipId} has already sent ${chip.warmupMessagesToday}/${messagesPerDay} messages today`);
    return;
  }

  // Get other chips from the same user to send messages to
  const otherChips = await db
    .select()
    .from(chips)
    .where(and(eq(chips.userId, chip.userId), eq(chips.isConnected, true)))
    .limit(10);

  if (otherChips.length < 2) {
    console.log(`[Warmup] Not enough connected chips for user ${chip.userId} to perform warmup`);
    return;
  }

  // Calculate how many messages to send in this batch (distribute throughout the day)
  const messagesPerBatch = Math.ceil(messagesPerDay / 8); // Assuming 8 batches per day (every 3 hours)
  const messagesToSend = Math.min(messagesPerBatch, messagesPerDay - chip.warmupMessagesToday);

  console.log(`[Warmup] Sending ${messagesToSend} warmup messages for chip ${chipId} (Phase ${phase}, Day ${chip.warmupCurrentDay})`);

  // Send messages
  for (let i = 0; i < messagesToSend; i++) {
    // Pick a random recipient chip (not the sender)
    const recipientChip = otherChips.filter(c => c.id !== chipId)[Math.floor(Math.random() * (otherChips.length - 1))];
    if (!recipientChip) continue;

    const message = getRandomMessage();

    try {
      // Send message via WhatsApp
      const result = await sendMessage(chip.id, recipientChip.phoneNumber, message);
      if (!result.success) {
        throw new Error("Failed to send message");
      }

      // Log warmup message
      const warmupLog: InsertWarmupHistory = {
        chipId: chip.id,
        userId: chip.userId,
        senderChipId: chip.id,
        recipientNumber: recipientChip.phoneNumber,
        messageContent: message,
        status: "sent",
        warmupPhase: phase,
        warmupDay: chip.warmupCurrentDay,
      };

      await db.insert(warmupHistory).values(warmupLog);

      console.log(`[Warmup] Sent message from chip ${chipId} to ${recipientChip.phoneNumber}`);

      // Add small delay between messages (1-3 seconds)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    } catch (error) {
      console.error(`[Warmup] Failed to send message from chip ${chipId}:`, error);

      // Log failed message
      const warmupLog: InsertWarmupHistory = {
        chipId: chip.id,
        userId: chip.userId,
        senderChipId: chip.id,
        recipientNumber: recipientChip.phoneNumber,
        messageContent: message,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        warmupPhase: phase,
        warmupDay: chip.warmupCurrentDay,
      };

      await db.insert(warmupHistory).values(warmupLog);
    }
  }

  // Update chip warmup counter
  await db
    .update(chips)
    .set({
      warmupMessagesToday: chip.warmupMessagesToday + messagesToSend,
    })
    .where(eq(chips.id, chipId));
}

/**
 * Reset daily warmup counters and advance day
 * Should be called once per day at midnight
 */
export async function resetWarmupDailyCounters() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all chips in warmup
  const chipsInWarmup = await db
    .select()
    .from(chips)
    .where(eq(chips.warmupStatus, "in_progress"));

  for (const chip of chipsInWarmup) {
    const settings = await getWarmupSettings(chip.userId);
    const newDay = chip.warmupCurrentDay + 1;

    // Check if warmup is complete
    if (newDay > settings.warmupDurationDays) {
      await stopWarmup(chip.id, true);
      console.log(`[Warmup] Completed warmup for chip ${chip.id}`);
    } else {
      // Advance to next day
      await db
        .update(chips)
        .set({
          warmupCurrentDay: newDay,
          warmupMessagesToday: 0,
        })
        .where(eq(chips.id, chip.id));

      console.log(`[Warmup] Advanced chip ${chip.id} to day ${newDay}`);
    }
  }
}

/**
 * Get warmup progress for a chip (0-100%)
 */
export async function getWarmupProgress(chipId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const chip = await db.select().from(chips).where(eq(chips.id, chipId)).limit(1);
  if (chip.length === 0) return 0;

  const chipData = chip[0];
  if (chipData.warmupStatus === "completed") return 100;
  if (chipData.warmupStatus === "not_started") return 0;
  if (chipData.warmupStatus === "skipped") return 100;

  const settings = await getWarmupSettings(chipData.userId);
  const progress = (chipData.warmupCurrentDay / settings.warmupDurationDays) * 100;

  return Math.min(100, Math.round(progress));
}
