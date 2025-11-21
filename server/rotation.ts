import * as db from "./db";
import { Chip } from "../drizzle/schema";
import { dispatchWebhookEvent } from "./webhook-dispatcher";
import { notifyChipPaused, notifyChipNearLimit } from "./notifications";

/**
 * Thermometer Risk Score Calculator
 * Calculates a risk score (0-100) based on multiple factors
 */
export function calculateRiskScore(chip: Chip): number {
  let riskScore = 0;

  // Factor 1: Daily usage percentage (0-40 points)
  const dailyUsagePercent = (chip.messagesSentToday / chip.dailyLimit) * 100;
  if (dailyUsagePercent >= 90) {
    riskScore += 40;
  } else if (dailyUsagePercent >= 75) {
    riskScore += 30;
  } else if (dailyUsagePercent >= 50) {
    riskScore += 20;
  } else if (dailyUsagePercent >= 25) {
    riskScore += 10;
  }

  // Factor 2: Total usage percentage (0-30 points)
  const totalUsagePercent = (chip.messagesSentTotal / chip.totalLimit) * 100;
  if (totalUsagePercent >= 90) {
    riskScore += 30;
  } else if (totalUsagePercent >= 75) {
    riskScore += 20;
  } else if (totalUsagePercent >= 50) {
    riskScore += 10;
  }

  // Factor 3: Recent activity (0-20 points)
  // If last message was sent in the last 5 minutes, add risk
  if (chip.lastMessageAt) {
    const minutesSinceLastMessage = (Date.now() - chip.lastMessageAt.getTime()) / 1000 / 60;
    if (minutesSinceLastMessage < 1) {
      riskScore += 20; // Very recent activity
    } else if (minutesSinceLastMessage < 5) {
      riskScore += 10; // Recent activity
    }
  }

  // Factor 4: Connection status (0-10 points)
  if (!chip.isConnected) {
    riskScore += 10; // Not connected is risky
  }

  return Math.min(riskScore, 100); // Cap at 100
}

/**
 * Determines if a chip should be paused based on risk score
 */
export function shouldPauseChip(chip: Chip): { shouldPause: boolean; reason?: string } {
  const riskScore = calculateRiskScore(chip);

  // High risk threshold: 80+
  if (riskScore >= 80) {
    return {
      shouldPause: true,
      reason: `Alto risco de bloqueio (${riskScore}/100). Limite diário ou total quase atingido.`,
    };
  }

  // Daily limit reached
  if (chip.messagesSentToday >= chip.dailyLimit) {
    return {
      shouldPause: true,
      reason: `Limite diário de ${chip.dailyLimit} mensagens atingido.`,
    };
  }

  // Total limit reached
  if (chip.messagesSentTotal >= chip.totalLimit) {
    return {
      shouldPause: true,
      reason: `Limite total de ${chip.totalLimit} mensagens atingido.`,
    };
  }

  // Not connected
  if (!chip.isConnected) {
    return {
      shouldPause: true,
      reason: "Chip não está conectado ao WhatsApp.",
    };
  }

  return { shouldPause: false };
}

/**
 * Selects the best chip for rotation based on:
 * 1. Lowest risk score
 * 2. Lowest daily usage
 * 3. Lowest total usage
 */
export async function selectChipForRotation(userId: number): Promise<{
  chip: Chip | null;
  reason: string;
}> {
  const activeChips = await db.getActiveChipsByUserId(userId);

  if (activeChips.length === 0) {
    return {
      chip: null,
      reason: "Nenhum chip ativo disponível. Verifique se há chips cadastrados e conectados.",
    };
  }

  // Calculate risk scores for all chips
  const chipsWithRisk = activeChips.map((chip) => ({
    chip,
    riskScore: calculateRiskScore(chip),
    shouldPause: shouldPauseChip(chip),
  }));

  // Filter out chips that should be paused
  const availableChips = chipsWithRisk.filter((c) => !c.shouldPause.shouldPause);

  if (availableChips.length === 0) {
    // All chips are at risk or paused, pause them all
    for (const chipData of chipsWithRisk) {
      if (chipData.chip.status === "active") {
        await db.updateChip(chipData.chip.id, {
          status: "paused",
          pausedReason: chipData.shouldPause.reason,
          riskScore: chipData.riskScore,
        });
      }
    }

    return {
      chip: null,
      reason: "Todos os chips atingiram limites ou estão em alto risco. Sistema pausado automaticamente.",
    };
  }

  // Sort by risk score (lowest first), then by daily usage
  availableChips.sort((a, b) => {
    if (a.riskScore !== b.riskScore) {
      return a.riskScore - b.riskScore;
    }
    return a.chip.messagesSentToday - b.chip.messagesSentToday;
  });

  const selectedChip = availableChips[0].chip;

  return {
    chip: selectedChip,
    reason: `Chip "${selectedChip.name}" selecionado (Risco: ${availableChips[0].riskScore}/100, Mensagens hoje: ${selectedChip.messagesSentToday}/${selectedChip.dailyLimit})`,
  };
}

/**
 * Updates chip counters after sending a message
 */
export async function incrementChipCounters(chipId: number): Promise<void> {
  const chip = await db.getChipById(chipId);
  if (!chip) {
    throw new Error(`Chip ${chipId} não encontrado`);
  }

  const newMessagesSentToday = chip.messagesSentToday + 1;
  const newMessagesSentTotal = chip.messagesSentTotal + 1;
  const newRiskScore = calculateRiskScore({
    ...chip,
    messagesSentToday: newMessagesSentToday,
    messagesSentTotal: newMessagesSentTotal,
    lastMessageAt: new Date(),
  });

  // Check if chip should be paused after this message
  const { shouldPause, reason } = shouldPauseChip({
    ...chip,
    messagesSentToday: newMessagesSentToday,
    messagesSentTotal: newMessagesSentTotal,
  });

  await db.updateChip(chipId, {
    messagesSentToday: newMessagesSentToday,
    messagesSentTotal: newMessagesSentTotal,
    lastMessageAt: new Date(),
    riskScore: newRiskScore,
    ...(shouldPause && {
      status: "paused",
      pausedReason: reason,
    }),
  });

  // Dispatch webhook and notification if chip was paused
  if (shouldPause) {
    await dispatchWebhookEvent(chip.userId, "chip.paused", {
      chipId: chip.id,
      chipName: chip.name,
      riskScore: newRiskScore,
      reason: reason || "Unknown reason",
      messagesSentToday: newMessagesSentToday,
      dailyLimit: chip.dailyLimit,
    });

    // Send notification
    await notifyChipPaused(
      chip.userId,
      chip.name,
      reason || "Unknown reason",
      newRiskScore
    );
  }

  // Notify if chip reached 90% of daily limit
  const usagePercent = (newMessagesSentToday / chip.dailyLimit) * 100;
  if (usagePercent >= 90 && usagePercent < 100 && !shouldPause) {
    await notifyChipNearLimit(
      chip.userId,
      chip.name,
      newMessagesSentToday,
      chip.dailyLimit
    );
  }
}

/**
 * Resets daily counters for all chips (should be run daily via cron)
 */
export async function resetAllDailyCounters(): Promise<void> {
  await db.resetDailyCounters();
}

/**
 * Updates risk scores for all chips
 */
export async function updateAllRiskScores(userId: number): Promise<void> {
  const allChips = await db.getChipsByUserId(userId);

  for (const chip of allChips) {
    const riskScore = calculateRiskScore(chip);
    const { shouldPause, reason } = shouldPauseChip(chip);

    const updates: any = { riskScore };

    if (shouldPause && chip.status === "active") {
      updates.status = "paused";
      updates.pausedReason = reason;
    }

    await db.updateChip(chip.id, updates);
  }
}
