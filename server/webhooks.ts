/**
 * Webhook handlers for incoming WhatsApp messages
 */

import * as db from "./db";
import * as whatsapp from "./whatsapp";
import { dispatchWebhookEvent } from "./webhook-dispatcher";

/**
 * Initialize webhook listeners
 */
export function initializeWebhooks(): void {
  console.log("[Webhooks] Initializing message listeners...");
  console.log("[Webhooks] TODO: Implement message listeners with Baileys");
  
  // TODO: Implement with Baileys event listeners
  /*
  whatsapp.onMessage(async (chipId: number, message: any) => {
    try {
      // Get chip info
      const chip = await db.getChipById(chipId);
      if (!chip) {
        console.error(`[Webhooks] Chip ${chipId} not found`);
        return;
      }

      // Extract message data
      const contactNumber = message.from.replace("@c.us", "");
      const contactName = (message as any).notifyName || (message as any)._data?.notifyName || contactNumber;
      const messageContent = message.body || "[Media]";
      const messageType = getMessageType(message);
      const isFromMe = message.fromMe || false;

      console.log(`[Webhooks] Processing message from ${contactName} (${contactNumber}) on chip ${chip.name}`);

      // Save to conversations table
      await db.createConversation({
        chipId: chip.id,
        userId: chip.userId,
        contactNumber,
        contactName,
        messageContent,
        messageType,
        isFromMe,
        messageId: (message as any).id?.id || (message as any).id || 'unknown',
        timestamp: new Date((message as any).timestamp * 1000 || Date.now()),
      });

      console.log(`[Webhooks] Message saved to database`);

      // Dispatch webhook event if message is not from us
      if (!isFromMe) {
        await dispatchWebhookEvent(chip.userId, "message.received", {
          chipId: chip.id,
          chipName: chip.name,
          senderNumber: contactNumber,
          senderName: contactName,
          messageContent,
          messageType,
          receivedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("[Webhooks] Error processing message:", error);
    }
  });
  */

  console.log("[Webhooks] Message listeners initialized successfully");
}

/**
 * Determine message type from message object
 */
function getMessageType(message: any): "text" | "image" | "video" | "document" | "audio" {
  if (message.type === "chat" || message.type === "text") {
    return "text";
  } else if (message.type === "image") {
    return "image";
  } else if (message.type === "video") {
    return "video";
  } else if (message.type === "document" || message.type === "ptt") {
    return "document";
  } else if (message.type === "audio") {
    return "audio";
  }
  
  return "text"; // Default
}
