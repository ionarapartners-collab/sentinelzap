import { getDb } from "./db";
import { bulkCampaigns, bulkContacts } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { calculateRiskScore } from "./rotation";
import { getChipsByUserId, updateChip } from "./db";
import { sendMessage } from "./whatsapp";

/**
 * Processa uma campanha de envio em massa
 * Envia mensagens com rodízio automático de chips
 */
export async function processBulkCampaign(campaignId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Buscar campanha
    const [campaign] = await db
      .select()
      .from(bulkCampaigns)
      .where(and(eq(bulkCampaigns.id, campaignId), eq(bulkCampaigns.userId, userId)))
      .limit(1);

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    if (campaign.status !== "pending" && campaign.status !== "paused") {
      throw new Error(`Campaign is ${campaign.status}, cannot process`);
    }

    // Atualizar status para running
    await db
      .update(bulkCampaigns)
      .set({
        status: "running",
        startedAt: campaign.startedAt || new Date(),
      })
      .where(eq(bulkCampaigns.id, campaignId));

    // Buscar contatos pendentes
    const pendingContacts = await db
      .select()
      .from(bulkContacts)
      .where(
        and(
          eq(bulkContacts.campaignId, campaignId),
          eq(bulkContacts.status, "pending")
        )
      );

    let sentCount = campaign.sentCount;
    let failedCount = campaign.failedCount;

    // Processar cada contato
    for (const contact of pendingContacts) {
      try {
        // Selecionar melhor chip (lógica inline)
        const allChips = await getChipsByUserId(userId);
        const activeChips = allChips.filter(
          (c) => c.status === "active" && c.isConnected
        );

        if (activeChips.length === 0) {
          throw new Error("No active chip available");
        }

        // Calcular risco e ordenar por menor risco
        const chipsWithRisk = activeChips.map((c) => ({
          ...c,
          risk: calculateRiskScore(c),
        }));
        chipsWithRisk.sort((a, b) => a.risk - b.risk);

        const chip = chipsWithRisk[0];

        // Personalizar mensagem (substituir variáveis)
        let personalizedMessage = campaign.messageTemplate;
        personalizedMessage = personalizedMessage.replace(/\{nome\}/gi, contact.name || "");
        personalizedMessage = personalizedMessage.replace(/\{telefone\}/gi, contact.phoneNumber);

        // Processar custom fields se existirem
        if (contact.customFields) {
          try {
            const customFields = JSON.parse(contact.customFields);
            Object.keys(customFields).forEach((key) => {
              const regex = new RegExp(`\\{${key}\\}`, "gi");
              personalizedMessage = personalizedMessage.replace(regex, customFields[key]);
            });
          } catch (e) {
            console.error("Error parsing custom fields:", e);
          }
        }

        // Enviar mensagem via WhatsApp
        try {
          await sendMessage(
            chip.id,
            contact.phoneNumber,
            personalizedMessage
          );
          // Atualizar contato como enviado
          await db
            .update(bulkContacts)
            .set({
              status: "sent",
              sentAt: new Date(),
              chipUsedId: chip.id,
            })
            .where(eq(bulkContacts.id, contact.id));

          // Atualizar chip após envio
          await updateChip(chip.id, {
            messagesSentToday: chip.messagesSentToday + 1,
            messagesSentTotal: chip.messagesSentTotal + 1,
            lastMessageAt: new Date(),
          });

          sentCount++;
        } catch (sendError: any) {
          throw new Error(sendError.message || "Failed to send message");
        }

        // Delay entre mensagens (1-3 segundos para parecer mais humano)
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));
      } catch (error: any) {
        // Marcar contato como falho
        await db
          .update(bulkContacts)
          .set({
            status: "failed",
            errorMessage: error.message || "Unknown error",
          })
          .where(eq(bulkContacts.id, contact.id));

        failedCount++;
        console.error(`Failed to send to ${contact.phoneNumber}:`, error);
      }
    }

    // Atualizar campanha como completa
    await db
      .update(bulkCampaigns)
      .set({
        status: "completed",
        sentCount,
        failedCount,
        completedAt: new Date(),
      })
      .where(eq(bulkCampaigns.id, campaignId));

    return {
      success: true,
      sentCount,
      failedCount,
      totalContacts: campaign.totalContacts,
    };
  } catch (error: any) {
    // Marcar campanha como falha
    await db
      .update(bulkCampaigns)
      .set({
        status: "failed",
      })
      .where(eq(bulkCampaigns.id, campaignId));

    throw error;
  }
}

/**
 * Pausa uma campanha em execução
 */
export async function pauseBulkCampaign(campaignId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(bulkCampaigns)
    .set({
      status: "paused",
    })
    .where(and(eq(bulkCampaigns.id, campaignId), eq(bulkCampaigns.userId, userId)));

  return { success: true };
}

/**
 * Parse CSV content e retorna array de contatos
 */
export function parseCSV(csvContent: string): Array<{ phoneNumber: string; name?: string; customFields?: Record<string, string> }> {
  const lines = csvContent.trim().split("\n");
  
  if (lines.length === 0) {
    throw new Error("CSV is empty");
  }

  // Primeira linha é o cabeçalho
  const headers = lines[0].split(",").map((h) => h.trim());
  
  const phoneIndex = headers.findIndex((h) => h.toLowerCase() === "telefone" || h.toLowerCase() === "phone");
  const nameIndex = headers.findIndex((h) => h.toLowerCase() === "nome" || h.toLowerCase() === "name");

  if (phoneIndex === -1) {
    throw new Error("CSV must have a 'telefone' or 'phone' column");
  }

  const contacts: Array<{ phoneNumber: string; name?: string; customFields?: Record<string, string> }> = [];

  // Processar linhas de dados
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    
    if (values.length === 0 || !values[phoneIndex]) {
      continue; // Pular linhas vazias
    }

    const contact: { phoneNumber: string; name?: string; customFields?: Record<string, string> } = {
      phoneNumber: values[phoneIndex],
    };

    if (nameIndex !== -1 && values[nameIndex]) {
      contact.name = values[nameIndex];
    }

    // Adicionar campos personalizados
    const customFields: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (index !== phoneIndex && index !== nameIndex && values[index]) {
        customFields[header] = values[index];
      }
    });

    if (Object.keys(customFields).length > 0) {
      contact.customFields = customFields;
    }

    contacts.push(contact);
  }

  return contacts;
}
