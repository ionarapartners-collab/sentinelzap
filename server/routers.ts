import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as rotation from "./rotation";
import * as whatsapp from "./whatsapp";
import { apiKeysRouter } from "./api-keys-router";
import { dispatchWebhookEvent } from "./webhook-dispatcher";
import { warmupRouter } from "./routers/warmup";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================
  // CHIP MANAGEMENT ROUTES
  // ============================================
  chips: router({
    // List all chips for the current user
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getChipsByUserId(ctx.user.id);
    }),

    // Get a single chip by ID
    get: protectedProcedure
      .input(z.object({ chipId: z.number() }))
      .query(async ({ input }) => {
        return db.getChipById(input.chipId);
      }),

    // Create a new chip
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        phoneNumber: z.string().min(1),
        sessionId: z.string().min(1),
        dailyLimit: z.number().default(100),
        totalLimit: z.number().default(1000),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createChip({
          userId: ctx.user.id,
          name: input.name,
          phoneNumber: input.phoneNumber,
          sessionId: input.sessionId,
          dailyLimit: input.dailyLimit,
          totalLimit: input.totalLimit,
        });
      }),

    // Update chip configuration
    update: protectedProcedure
      .input(z.object({
        chipId: z.number(),
        name: z.string().optional(),
        dailyLimit: z.number().optional(),
        totalLimit: z.number().optional(),
        status: z.enum(["active", "paused", "offline", "error"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { chipId, ...updates } = input;
        await db.updateChip(chipId, updates);
        return { success: true };
      }),

    // Delete a chip
    delete: protectedProcedure
      .input(z.object({ chipId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteChip(input.chipId);
        return { success: true };
      }),

    // Get active chips (for rotation logic)
    getActive: protectedProcedure.query(async ({ ctx }) => {
      return db.getActiveChipsByUserId(ctx.user.id);
    }),

    // Update chip risk score and status
    updateRiskScore: protectedProcedure
      .input(z.object({
        chipId: z.number(),
        riskScore: z.number().min(0).max(100),
        status: z.enum(["active", "paused", "offline", "error"]).optional(),
        pausedReason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { chipId, ...updates } = input;
        await db.updateChip(chipId, updates);
        return { success: true };
      }),

    // Update connection status
    updateConnection: protectedProcedure
      .input(z.object({
        chipId: z.number(),
        isConnected: z.boolean(),
        qrCode: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { chipId, isConnected, qrCode } = input;
        const updates: any = { isConnected };
        if (isConnected) {
          updates.lastConnectedAt = new Date();
          updates.status = "active";
        } else {
          updates.status = "offline";
        }
        if (qrCode !== undefined) {
          updates.qrCode = qrCode;
        }
        await db.updateChip(chipId, updates);
        return { success: true };
      }),
  }),

  // ============================================
  // MESSAGE HISTORY ROUTES
  // ============================================
  messages: router({
    // Get message history for current user
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(100) }))
      .query(async ({ ctx, input }) => {
        return db.getMessageHistoryByUserId(ctx.user.id, input.limit);
      }),

    // Get message history for a specific chip
    byChip: protectedProcedure
      .input(z.object({ 
        chipId: z.number(),
        limit: z.number().default(100) 
      }))
      .query(async ({ input }) => {
        return db.getMessageHistoryByChipId(input.chipId, input.limit);
      }),

    // Create a new message record
    create: protectedProcedure
      .input(z.object({
        chipId: z.number(),
        recipientNumber: z.string(),
        recipientName: z.string().optional(),
        messageContent: z.string(),
        messageType: z.enum(["text", "image", "video", "document", "audio"]).default("text"),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createMessageHistory({
          userId: ctx.user.id,
          chipId: input.chipId,
          recipientNumber: input.recipientNumber,
          recipientName: input.recipientName,
          messageContent: input.messageContent,
          messageType: input.messageType,
        });
      }),

    // Update message status
    updateStatus: protectedProcedure
      .input(z.object({
        messageId: z.number(),
        status: z.enum(["pending", "sent", "delivered", "read", "failed"]),
        errorMessage: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateMessageStatus(input.messageId, input.status, input.errorMessage);
        return { success: true };
      }),
  }),

  // ============================================
  // CONVERSATION (CRM) ROUTES
  // ============================================
  conversations: router({
    // Get all conversations for current user
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(100) }))
      .query(async ({ ctx, input }) => {
        return db.getConversationsByUserId(ctx.user.id, input.limit);
      }),

    // Get conversations for a specific chip
    byChip: protectedProcedure
      .input(z.object({ 
        chipId: z.number(),
        limit: z.number().default(100) 
      }))
      .query(async ({ input }) => {
        return db.getConversationsByChipId(input.chipId, input.limit);
      }),

    // Get conversation with a specific contact
    byContact: protectedProcedure
      .input(z.object({
        contactNumber: z.string(),
        limit: z.number().default(50),
      }))
      .query(async ({ ctx, input }) => {
        return db.getConversationsByContact(ctx.user.id, input.contactNumber, input.limit);
      }),

    // Create a new conversation entry (webhook from WhatsApp)
    create: protectedProcedure
      .input(z.object({
        chipId: z.number(),
        contactNumber: z.string(),
        contactName: z.string().optional(),
        messageContent: z.string(),
        messageType: z.enum(["text", "image", "video", "document", "audio"]).default("text"),
        isFromMe: z.boolean().default(false),
        messageId: z.string().optional(),
        timestamp: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createConversation({
          userId: ctx.user.id,
          chipId: input.chipId,
          contactNumber: input.contactNumber,
          contactName: input.contactName,
          messageContent: input.messageContent,
          messageType: input.messageType,
          isFromMe: input.isFromMe,
          messageId: input.messageId,
          timestamp: input.timestamp,
        });
      }),
  }),

  // ============================================
  // ROTATION & THERMOMETER ROUTES
  // ============================================
  rotation: router({
    // Select the best chip for sending the next message
    selectChip: protectedProcedure.query(async ({ ctx }) => {
      return rotation.selectChipForRotation(ctx.user.id);
    }),

    // Send a message through the rotation system
    sendMessage: protectedProcedure
      .input(z.object({
        recipientNumber: z.string(),
        recipientName: z.string().optional(),
        messageContent: z.string(),
        messageType: z.enum(["text", "image", "video", "document", "audio"]).default("text"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Step 1: Select best chip
        const { chip, reason } = await rotation.selectChipForRotation(ctx.user.id);

        if (!chip) {
          return {
            success: false,
            error: reason,
          };
        }

        // Step 2: Send message via WhatsApp
        let sendResult;
        try {
          sendResult = await whatsapp.sendMessage(
            chip.id,
            input.recipientNumber,
            input.messageContent
          );
        } catch (error) {
          return {
            success: false,
            error: `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }

        if (!sendResult.success) {
          return {
            success: false,
            error: `Failed to send message`,
          };
        }

        // Step 3: Create message history record
        const message = await db.createMessageHistory({
          userId: ctx.user.id,
          chipId: chip.id,
          recipientNumber: input.recipientNumber,
          recipientName: input.recipientName,
          messageContent: input.messageContent,
          messageType: input.messageType,
        });

        // Update message status to sent
        await db.updateMessageStatus(message.id, "sent");

        // Step 4: Increment chip counters
        await rotation.incrementChipCounters(chip.id);

        // Step 5: Dispatch webhook event
        await dispatchWebhookEvent(ctx.user.id, "message.sent", {
          chipId: chip.id,
          chipName: chip.name,
          recipientNumber: input.recipientNumber,
          messageContent: input.messageContent,
          sentAt: new Date().toISOString(),
        });

        // Step 6: Return success with chip info
        return {
          success: true,
          message,
          chipUsed: {
            id: chip.id,
            name: chip.name,
            phoneNumber: chip.phoneNumber,
          },
          reason,
        };
      }),

    // Update risk scores for all chips
    updateRiskScores: protectedProcedure.mutation(async ({ ctx }) => {
      await rotation.updateAllRiskScores(ctx.user.id);
      return { success: true };
    }),

    // Reset daily counters (admin only, or scheduled)
    resetDailyCounters: protectedProcedure.mutation(async () => {
      await rotation.resetAllDailyCounters();
      return { success: true };
    }),

    // Get rotation status and recommendations
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const allChips = await db.getChipsByUserId(ctx.user.id);
      
      const chipsWithRisk = allChips.map((chip) => ({
        ...chip,
        currentRiskScore: rotation.calculateRiskScore(chip),
        shouldPause: rotation.shouldPauseChip(chip),
      }));

      const activeCount = chipsWithRisk.filter(c => c.status === "active" && !c.shouldPause.shouldPause).length;
      const pausedCount = chipsWithRisk.filter(c => c.status === "paused" || c.shouldPause.shouldPause).length;
      const offlineCount = chipsWithRisk.filter(c => c.status === "offline").length;

      return {
        chips: chipsWithRisk,
        summary: {
          total: allChips.length,
          active: activeCount,
          paused: pausedCount,
          offline: offlineCount,
        },
      };
      }),
  }),

  // ============================================
  // WHATSAPP SESSION MANAGEMENT ROUTES
  // ============================================
  whatsapp: router({
    // Initialize a WhatsApp session for a chip
    initSession: protectedProcedure
      .input(z.object({ chipId: z.number() }))
      .mutation(async ({ input }) => {
        const chip = await db.getChipById(input.chipId);
        if (!chip) {
          return { success: false, error: "Chip not found" };
        }

        const result = await whatsapp.initializeSession(input.chipId);
        return result;
      }),

    // Get QR code for a chip
    getQRCode: protectedProcedure
      .input(z.object({ chipId: z.number() }))
      .query(async ({ input }) => {
        const chip = await db.getChipById(input.chipId);
        if (!chip) {
          console.log(`[getQRCode] Chip ${input.chipId} not found`);
          return { qrCode: null };
        }

        const qrCodeFromMemory = await whatsapp.getQRCode(input.chipId);
        const qrCodeFromDB = chip.qrCode;
        const qrCode = qrCodeFromMemory || qrCodeFromDB;
        
        console.log(`[getQRCode] Chip ${input.chipId} (${chip.sessionId}):`);
        console.log(`  - QR from memory: ${qrCodeFromMemory ? 'YES (' + qrCodeFromMemory.length + ' chars)' : 'NO'}`);
        console.log(`  - QR from DB: ${qrCodeFromDB ? 'YES (' + qrCodeFromDB.length + ' chars)' : 'NO'}`);
        console.log(`  - Returning: ${qrCode ? 'YES' : 'NO'}`);
        
        return { qrCode };
      }),

    // Check session connection status
    checkConnection: protectedProcedure
      .input(z.object({ chipId: z.number() }))
      .query(async ({ input }) => {
        const chip = await db.getChipById(input.chipId);
        if (!chip) {
          return { isConnected: false };
        }

        const isConnected = whatsapp.isSessionActive(input.chipId);
        return { isConnected };
      }),

    // Logout and close session
    logout: protectedProcedure
      .input(z.object({ chipId: z.number() }))
      .mutation(async ({ input }) => {
        const chip = await db.getChipById(input.chipId);
        if (!chip) {
          return { success: false, error: "Chip not found" };
        }

        await whatsapp.disconnectSession(input.chipId);
        
        await db.updateChip(chip.id, {
          isConnected: false,
          status: "offline",
          qrCode: null,
        });

        return { success: true, message: "Chip desconectado com sucesso" };
      }),

    // Initialize all chips for current user
    initAllSessions: protectedProcedure.mutation(async ({ ctx }) => {
      // TODO: Implement batch initialization if needed
      return { success: true, message: "Batch initialization not implemented yet" };
    }),

    // Get active sessions (removed - not needed with Baileys)
  }),

  // ============================================
  // BULK SENDING ROUTES
  // ============================================
  bulk: router({
    // Create campaign from CSV
    createCampaign: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          messageTemplate: z.string(),
          csvContent: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { bulkCampaigns, bulkContacts } = await import("../drizzle/schema");
        const { parseCSV } = await import("./bulk-sender");
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error("Database not available");

        // Parse CSV
        const contacts = parseCSV(input.csvContent);

        // Create campaign
        const [campaign] = await dbInstance
          .insert(bulkCampaigns)
          .values({
            userId: ctx.user.id,
            name: input.name,
            messageTemplate: input.messageTemplate,
            totalContacts: contacts.length,
          })
          .$returningId();

        // Insert contacts
        const contactsToInsert = contacts.map((c) => ({
          campaignId: campaign.id,
          phoneNumber: c.phoneNumber,
          name: c.name,
          customFields: c.customFields ? JSON.stringify(c.customFields) : null,
        }));

        await dbInstance.insert(bulkContacts).values(contactsToInsert);

        return { success: true, campaignId: campaign.id };
      }),

    // List campaigns
    listCampaigns: protectedProcedure.query(async ({ ctx }) => {
      const { bulkCampaigns } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      return await dbInstance
        .select()
        .from(bulkCampaigns)
        .where(eq(bulkCampaigns.userId, ctx.user.id))
        .orderBy(desc(bulkCampaigns.createdAt));
    }),

    // Get campaign details
    getCampaign: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { bulkCampaigns, bulkContacts } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error("Database not available");

        const [campaign] = await dbInstance
          .select()
          .from(bulkCampaigns)
          .where(
            and(
              eq(bulkCampaigns.id, input.campaignId),
              eq(bulkCampaigns.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (!campaign) {
          throw new Error("Campaign not found");
        }

        const contacts = await dbInstance
          .select()
          .from(bulkContacts)
          .where(eq(bulkContacts.campaignId, input.campaignId));

        return { campaign, contacts };
      }),

    // Start campaign
    startCampaign: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { processBulkCampaign } = await import("./bulk-sender");
        
        // Run in background (don't await)
        processBulkCampaign(input.campaignId, ctx.user.id).catch((error) => {
          console.error("Bulk campaign error:", error);
        });

        return { success: true, message: "Campaign started" };
      }),

    // Pause campaign
    pauseCampaign: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { pauseBulkCampaign } = await import("./bulk-sender");
        return await pauseBulkCampaign(input.campaignId, ctx.user.id);
      }),
  }),

  // ============================================
  // API KEYS MANAGEMENT
  // ============================================
  apiKeys: apiKeysRouter,

  // ============================================
  // WARMUP MANAGEMENT
  // ============================================
  warmup: warmupRouter,
});

export type AppRouter = typeof appRouter;
