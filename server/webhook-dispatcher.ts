/**
 * Webhook Dispatcher
 * Handles webhook delivery with HMAC validation and automatic retry
 */

import * as crypto from "crypto";
import { getDb } from "./db";
import { webhookConfigs } from "../drizzle/schema";
import { eq } from "drizzle-orm";

interface WebhookEvent {
  event: string;
  timestamp: string;
  data: any;
}

interface WebhookLog {
  webhookId: number;
  event: string;
  payload: string;
  status: "success" | "failed" | "retrying";
  attempts: number;
  lastError?: string;
  deliveredAt?: Date;
}

/**
 * Generate HMAC signature for webhook payload
 */
function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Dispatch webhook to a single URL
 */
async function dispatchWebhook(
  url: string,
  payload: WebhookEvent,
  secret: string | null,
  attempt: number = 1
): Promise<{ success: boolean; error?: string }> {
  try {
    const payloadString = JSON.stringify(payload);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "SentinelZap-Webhook/1.0",
      "X-Webhook-Event": payload.event,
      "X-Webhook-Timestamp": payload.timestamp,
      "X-Webhook-Attempt": attempt.toString(),
    };

    // Add HMAC signature if secret is provided
    if (secret) {
      const signature = generateSignature(payloadString, secret);
      headers["X-Webhook-Signature"] = `sha256=${signature}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: payloadString,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

/**
 * Retry webhook with exponential backoff
 */
async function retryWebhook(
  url: string,
  payload: WebhookEvent,
  secret: string | null,
  maxAttempts: number = 3
): Promise<{ success: boolean; attempts: number; lastError?: string }> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await dispatchWebhook(url, payload, secret, attempt);

    if (result.success) {
      return { success: true, attempts: attempt };
    }

    lastError = result.error;

    // Don't sleep on last attempt
    if (attempt < maxAttempts) {
      // Exponential backoff: 2^attempt seconds
      const delayMs = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return { success: false, attempts: maxAttempts, lastError };
}

/**
 * Dispatch webhook event to all configured webhooks
 */
export async function dispatchWebhookEvent(
  userId: number,
  event: string,
  data: any
): Promise<void> {
  try {
    const dbInstance = await getDb();
    if (!dbInstance) {
      console.error("[Webhook] Database unavailable");
      return;
    }

    // Get all active webhooks for this user
    const webhooks = await dbInstance
      .select()
      .from(webhookConfigs)
      .where(eq(webhookConfigs.userId, userId));

    if (webhooks.length === 0) {
      console.log(`[Webhook] No webhooks configured for user ${userId}`);
      return;
    }

    const payload: WebhookEvent = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    // Dispatch to all webhooks that listen to this event
    const dispatchPromises = webhooks
      .filter((webhook) => {
        if (!webhook.isActive) return false;
        const events = JSON.parse(webhook.events);
        return events.includes(event);
      })
      .map(async (webhook) => {
        console.log(
          `[Webhook] Dispatching ${event} to ${webhook.name} (${webhook.url})`
        );

        const result = await retryWebhook(webhook.url, payload, webhook.secret);

        if (result.success) {
          console.log(
            `[Webhook] Successfully delivered to ${webhook.name} after ${result.attempts} attempt(s)`
          );

          // Update last triggered timestamp
          await dbInstance
            .update(webhookConfigs)
            .set({ lastTriggeredAt: new Date() })
            .where(eq(webhookConfigs.id, webhook.id));
        } else {
          console.error(
            `[Webhook] Failed to deliver to ${webhook.name} after ${result.attempts} attempts: ${result.lastError}`
          );
        }

        return result;
      });

    await Promise.all(dispatchPromises);
  } catch (error) {
    console.error("[Webhook] Error dispatching webhook event:", error);
  }
}

/**
 * Validate webhook signature (for incoming webhooks)
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature.startsWith("sha256=")) {
    return false;
  }

  const expectedSignature = generateSignature(payload, secret);
  const receivedSignature = signature.substring(7); // Remove "sha256=" prefix

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(receivedSignature, "hex")
  );
}
