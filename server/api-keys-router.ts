/**
 * tRPC Router for API Keys Management
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { apiKeys } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import * as crypto from "crypto";

export const apiKeysRouter = router({
  /**
   * Generate a new API key
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        expiresInDays: z.number().optional(), // null = never expires
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new Error("Database unavailable");
      }

      // Generate random API key (32 bytes = 64 hex characters)
      const apiKey = `sk_${crypto.randomBytes(32).toString("hex")}`;
      const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
      const keyPrefix = apiKey.substring(0, 10); // For display purposes

      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      const [result] = await dbInstance
        .insert(apiKeys)
        .values({
          userId: ctx.user.id,
          name: input.name,
          keyHash,
          keyPrefix,
          expiresAt,
        })
        .$returningId();

      return {
        id: result.id,
        name: input.name,
        apiKey, // Return the plain key ONLY ONCE
        keyPrefix,
        expiresAt,
        createdAt: new Date(),
      };
    }),

  /**
   * List all API keys for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const dbInstance = await getDb();
    if (!dbInstance) {
      throw new Error("Database unavailable");
    }

    const keys = await dbInstance
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        isActive: apiKeys.isActive,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
        expiresAt: apiKeys.expiresAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, ctx.user.id));

    return keys;
  }),

  /**
   * Deactivate an API key
   */
  deactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new Error("Database unavailable");
      }

      await dbInstance
        .update(apiKeys)
        .set({ isActive: false })
        .where(and(eq(apiKeys.id, input.id), eq(apiKeys.userId, ctx.user.id)));

      return { success: true };
    }),

  /**
   * Delete an API key
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const dbInstance = await getDb();
      if (!dbInstance) {
        throw new Error("Database unavailable");
      }

      await dbInstance
        .delete(apiKeys)
        .where(and(eq(apiKeys.id, input.id), eq(apiKeys.userId, ctx.user.id)));

      return { success: true };
    }),
});
