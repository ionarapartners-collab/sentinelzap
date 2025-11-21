/**
 * REST API for Make.com Integration
 * Provides endpoints for external automation tools
 */

import { Router, Request, Response, NextFunction } from "express";
import * as crypto from "crypto";
import { getDb } from "./db";
import { apiKeys, chips, webhookConfigs } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendMessage } from "./whatsapp";
import * as db from "./db";
import { calculateRiskScore } from "./rotation";

const router = Router();

// ============================================
// MIDDLEWARE: API Key Authentication
// ============================================

interface AuthenticatedRequest extends Request {
  userId?: number;
  apiKeyId?: number;
}

async function authenticateApiKey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: "Missing API key. Provide X-API-Key header.",
    });
  }

  try {
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
    const dbInstance = await getDb();
    if (!dbInstance) {
      return res.status(500).json({ success: false, error: "Database unavailable" });
    }

    const [key] = await dbInstance
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.isActive, true)))
      .limit(1);

    if (!key) {
      return res.status(401).json({
        success: false,
        error: "Invalid or inactive API key",
      });
    }

    // Check expiration
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      return res.status(401).json({
        success: false,
        error: "API key expired",
      });
    }

    // Update last used timestamp
    await dbInstance
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, key.id));

    req.userId = key.userId;
    req.apiKeyId = key.id;
    next();
  } catch (error) {
    console.error("API Key authentication error:", error);
    return res.status(500).json({
      success: false,
      error: "Authentication failed",
    });
  }
}

// ============================================
// ENDPOINT: Health Check
// ============================================

router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "SentinelZap API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// ENDPOINT: Send Message (with automatic rotation)
// ============================================

router.post("/messages/send", authenticateApiKey, async (req: AuthenticatedRequest, res) => {
  try {
    const { phoneNumber, message, chipId } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: phoneNumber, message",
      });
    }

    const userId = req.userId!;

    // If chipId is provided, use that chip. Otherwise, use rotation logic
    let selectedChip;

    if (chipId) {
      selectedChip = await db.getChipById(chipId);
      if (!selectedChip || selectedChip.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: "Chip not found or unauthorized",
        });
      }
    } else {
      // Automatic rotation: select best chip
      const allChips = await db.getChipsByUserId(userId);
      const activeChips = allChips.filter(
        (c) => c.status === "active" && c.isConnected
      );

      if (activeChips.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No active chips available",
        });
      }

      // Calculate risk and select chip with lowest risk
      const chipsWithRisk = activeChips.map((c) => ({
        ...c,
        risk: calculateRiskScore(c),
      }));
      chipsWithRisk.sort((a, b) => a.risk - b.risk);
      selectedChip = chipsWithRisk[0];
    }

    // Send message via WhatsApp
    await sendMessage(selectedChip.id, phoneNumber, message);

    // Update chip counters
    await db.updateChip(selectedChip.id, {
      messagesSentToday: selectedChip.messagesSentToday + 1,
      messagesSentTotal: selectedChip.messagesSentTotal + 1,
      lastMessageAt: new Date(),
    });

    // Create message history record
    await db.createMessageHistory({
      userId,
      chipId: selectedChip.id,
      recipientNumber: phoneNumber,
      messageContent: message,
      status: "sent",
    });

    return res.json({
      success: true,
      data: {
        chipId: selectedChip.id,
        chipName: selectedChip.name,
        phoneNumber: selectedChip.phoneNumber,
        recipientNumber: phoneNumber,
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Send message error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to send message",
    });
  }
});

// ============================================
// ENDPOINT: Get System Status
// ============================================

router.get("/status", authenticateApiKey, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const allChips = await db.getChipsByUserId(userId);

    const chipsWithRisk = allChips.map((chip) => ({
      id: chip.id,
      name: chip.name,
      phoneNumber: chip.phoneNumber,
      status: chip.status,
      isConnected: chip.isConnected,
      messagesSentToday: chip.messagesSentToday,
      messagesSentTotal: chip.messagesSentTotal,
      dailyLimit: chip.dailyLimit,
      totalLimit: chip.totalLimit,
      riskScore: calculateRiskScore(chip),
      lastMessageAt: chip.lastMessageAt,
    }));

    const summary = {
      total: allChips.length,
      active: chipsWithRisk.filter((c) => c.status === "active").length,
      paused: chipsWithRisk.filter((c) => c.status === "paused").length,
      offline: chipsWithRisk.filter((c) => c.status === "offline").length,
    };

    return res.json({
      success: true,
      data: {
        summary,
        chips: chipsWithRisk,
      },
    });
  } catch (error: any) {
    console.error("Get status error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to get status",
    });
  }
});

// ============================================
// ENDPOINT: List Chips
// ============================================

router.get("/chips", authenticateApiKey, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const allChips = await db.getChipsByUserId(userId);

    return res.json({
      success: true,
      data: allChips.map((chip) => ({
        id: chip.id,
        name: chip.name,
        phoneNumber: chip.phoneNumber,
        status: chip.status,
        isConnected: chip.isConnected,
        messagesSentToday: chip.messagesSentToday,
        messagesSentTotal: chip.messagesSentTotal,
        dailyLimit: chip.dailyLimit,
        totalLimit: chip.totalLimit,
        riskScore: chip.riskScore,
      })),
    });
  } catch (error: any) {
    console.error("List chips error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to list chips",
    });
  }
});

// ============================================
// ENDPOINT: Get Chip by ID
// ============================================

router.get("/chips/:chipId", authenticateApiKey, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const chipId = parseInt(req.params.chipId);

    const chip = await db.getChipById(chipId);

    if (!chip || chip.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: "Chip not found",
      });
    }

    return res.json({
      success: true,
      data: {
        id: chip.id,
        name: chip.name,
        phoneNumber: chip.phoneNumber,
        status: chip.status,
        isConnected: chip.isConnected,
        messagesSentToday: chip.messagesSentToday,
        messagesSentTotal: chip.messagesSentTotal,
        dailyLimit: chip.dailyLimit,
        totalLimit: chip.totalLimit,
        riskScore: chip.riskScore,
        lastMessageAt: chip.lastMessageAt,
      },
    });
  } catch (error: any) {
    console.error("Get chip error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to get chip",
    });
  }
});

// ============================================
// ENDPOINT: Create Chip
// ============================================

router.post("/chips", authenticateApiKey, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { name, phoneNumber, sessionId, dailyLimit, totalLimit } = req.body;

    if (!name || !phoneNumber || !sessionId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, phoneNumber, sessionId",
      });
    }

    const chip = await db.createChip({
      userId,
      name,
      phoneNumber,
      sessionId,
      dailyLimit: dailyLimit || 100,
      totalLimit: totalLimit || 1000,
    });

    return res.status(201).json({
      success: true,
      data: chip,
    });
  } catch (error: any) {
    console.error("Create chip error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create chip",
    });
  }
});

// ============================================
// ENDPOINT: Update Chip
// ============================================

router.patch("/chips/:chipId", authenticateApiKey, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const chipId = parseInt(req.params.chipId);

    const chip = await db.getChipById(chipId);

    if (!chip || chip.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: "Chip not found",
      });
    }

    const updates = req.body;
    await db.updateChip(chipId, updates);

    const updatedChip = await db.getChipById(chipId);

    return res.json({
      success: true,
      data: updatedChip,
    });
  } catch (error: any) {
    console.error("Update chip error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to update chip",
    });
  }
});

// ============================================
// ENDPOINT: Delete Chip
// ============================================

router.delete("/chips/:chipId", authenticateApiKey, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const chipId = parseInt(req.params.chipId);

    const chip = await db.getChipById(chipId);

    if (!chip || chip.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: "Chip not found",
      });
    }

    await db.deleteChip(chipId);

    return res.json({
      success: true,
      message: "Chip deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete chip error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to delete chip",
    });
  }
});

// ============================================
// ENDPOINT: Configure Webhook
// ============================================

router.post("/webhooks", authenticateApiKey, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { name, url, events } = req.body;

    if (!name || !url || !events || !Array.isArray(events)) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, url, events (array)",
      });
    }

    const dbInstance = await getDb();
    if (!dbInstance) {
      return res.status(500).json({ success: false, error: "Database unavailable" });
    }

    // Generate webhook secret
    const secret = crypto.randomBytes(32).toString("hex");

    const [webhook] = await dbInstance
      .insert(webhookConfigs)
      .values({
        userId,
        name,
        url,
        events: JSON.stringify(events),
        secret,
      })
      .$returningId();

    return res.status(201).json({
      success: true,
      data: {
        id: webhook.id,
        name,
        url,
        events,
        secret, // Return secret once for user to store
      },
    });
  } catch (error: any) {
    console.error("Create webhook error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create webhook",
    });
  }
});

// ============================================
// ENDPOINT: List Webhooks
// ============================================

router.get("/webhooks", authenticateApiKey, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const dbInstance = await getDb();
    if (!dbInstance) {
      return res.status(500).json({ success: false, error: "Database unavailable" });
    }

    const webhooks = await dbInstance
      .select()
      .from(webhookConfigs)
      .where(eq(webhookConfigs.userId, userId));

    return res.json({
      success: true,
      data: webhooks.map((w) => ({
        id: w.id,
        name: w.name,
        url: w.url,
        events: JSON.parse(w.events),
        isActive: w.isActive,
        createdAt: w.createdAt,
        lastTriggeredAt: w.lastTriggeredAt,
      })),
    });
  } catch (error: any) {
    console.error("List webhooks error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to list webhooks",
    });
  }
});

export default router;
