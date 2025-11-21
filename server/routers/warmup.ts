/**
 * Warmup router - tRPC routes for chip warmup management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { chips, warmupSettings, warmupHistory } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  startWarmup,
  stopWarmup,
  getWarmupProgress,
  getWarmupSettings,
  processWarmupMessages,
} from "../lib/warmup-automation";

export const warmupRouter = router({
  /**
   * Get warmup settings for current user
   */
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    return await getWarmupSettings(ctx.user.id);
  }),

  /**
   * Update warmup settings
   */
  updateSettings: protectedProcedure
    .input(
      z.object({
        warmupDurationDays: z.number().min(7).max(30),
        phase1MessagesPerDay: z.number().min(5).max(50),
        phase2MessagesPerDay: z.number().min(10).max(100),
        phase3MessagesPerDay: z.number().min(20).max(150),
        phase1Duration: z.number().min(1).max(10),
        phase2Duration: z.number().min(1).max(10),
        phase3Duration: z.number().min(1).max(20),
        blockUnwarmedChips: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if settings exist
      const existing = await db
        .select()
        .from(warmupSettings)
        .where(eq(warmupSettings.userId, ctx.user.id))
        .limit(1);

      if (existing.length === 0) {
        // Create new settings
        await db.insert(warmupSettings).values({
          userId: ctx.user.id,
          ...input,
        });
      } else {
        // Update existing settings
        await db
          .update(warmupSettings)
          .set(input)
          .where(eq(warmupSettings.userId, ctx.user.id));
      }

      return { success: true };
    }),

  /**
   * Start warmup for a chip
   */
  startWarmup: protectedProcedure
    .input(z.object({ chipId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify chip ownership
      const chip = await db
        .select()
        .from(chips)
        .where(and(eq(chips.id, input.chipId), eq(chips.userId, ctx.user.id)))
        .limit(1);

      if (chip.length === 0) {
        throw new Error("Chip not found or access denied");
      }

      if (!chip[0].isConnected) {
        throw new Error("Chip must be connected before starting warmup");
      }

      await startWarmup(input.chipId);

      return { success: true, message: "Warmup started successfully" };
    }),

  /**
   * Stop/skip warmup for a chip
   */
  stopWarmup: protectedProcedure
    .input(
      z.object({
        chipId: z.number(),
        markAsCompleted: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify chip ownership
      const chip = await db
        .select()
        .from(chips)
        .where(and(eq(chips.id, input.chipId), eq(chips.userId, ctx.user.id)))
        .limit(1);

      if (chip.length === 0) {
        throw new Error("Chip not found or access denied");
      }

      await stopWarmup(input.chipId, input.markAsCompleted);

      return {
        success: true,
        message: input.markAsCompleted ? "Warmup completed" : "Warmup skipped",
      };
    }),

  /**
   * Get warmup status for all user chips
   */
  getWarmupStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userChips = await db
      .select()
      .from(chips)
      .where(eq(chips.userId, ctx.user.id));

    const settings = await getWarmupSettings(ctx.user.id);

    const chipsWithProgress = await Promise.all(
      userChips.map(async (chip) => {
        const progress = await getWarmupProgress(chip.id);
        const { phase, messagesPerDay } = getPhaseInfo(chip.warmupCurrentDay, settings);

        return {
          id: chip.id,
          name: chip.name,
          phoneNumber: chip.phoneNumber,
          warmupStatus: chip.warmupStatus,
          warmupStartDate: chip.warmupStartDate,
          warmupEndDate: chip.warmupEndDate,
          warmupCurrentDay: chip.warmupCurrentDay,
          warmupMessagesToday: chip.warmupMessagesToday,
          progress,
          currentPhase: phase,
          targetMessagesPerDay: messagesPerDay,
          isConnected: chip.isConnected,
          status: chip.status,
        };
      })
    );

    return {
      chips: chipsWithProgress,
      settings,
    };
  }),

  /**
   * Send warmup messages manually for all active chips
   */
  sendWarmupNow: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get all chips in warmup that belong to user
    const chipsInWarmup = await db
      .select()
      .from(chips)
      .where(and(eq(chips.userId, ctx.user.id), eq(chips.warmupStatus, "in_progress")));

    if (chipsInWarmup.length === 0) {
      throw new Error("No chips in warmup. Start warmup for at least one chip first.");
    }

    console.log(`[Warmup] Manual warmup triggered for ${chipsInWarmup.length} chips`);

    let successCount = 0;
    let errorCount = 0;

    for (const chip of chipsInWarmup) {
      try {
        await processWarmupMessages(chip.id);
        successCount++;
      } catch (error) {
        console.error(`[Warmup] Error processing warmup for chip ${chip.id}:`, error);
        errorCount++;
      }
    }

    return {
      success: true,
      message: `Warmup messages sent: ${successCount} successful, ${errorCount} failed`,
      successCount,
      errorCount,
    };
  }),

  /**
   * Get warmup history for chips
   */
  getWarmupHistory: protectedProcedure
    .input(
      z.object({
        chipId: z.number(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify chip ownership
      const chip = await db
        .select()
        .from(chips)
        .where(and(eq(chips.id, input.chipId), eq(chips.userId, ctx.user.id)))
        .limit(1);

      if (chip.length === 0) {
        throw new Error("Chip not found or access denied");
      }

      const history = await db
        .select()
        .from(warmupHistory)
        .where(eq(warmupHistory.chipId, input.chipId))
        .orderBy(desc(warmupHistory.sentAt))
        .limit(input.limit);

      return history;
    }),
});

/**
 * Helper function to get phase info
 */
function getPhaseInfo(currentDay: number, settings: any): { phase: number; messagesPerDay: number } {
  if (currentDay <= settings.phase1Duration) {
    return { phase: 1, messagesPerDay: settings.phase1MessagesPerDay };
  } else if (currentDay <= settings.phase1Duration + settings.phase2Duration) {
    return { phase: 2, messagesPerDay: settings.phase2MessagesPerDay };
  } else {
    return { phase: 3, messagesPerDay: settings.phase3MessagesPerDay };
  }
}
