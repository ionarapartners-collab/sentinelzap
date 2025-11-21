/**
 * Notification System
 * Sends notifications via Email and Telegram
 */

import nodemailer from "nodemailer";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Email configuration (using environment variables)
const EMAIL_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const EMAIL_PORT = parseInt(process.env.SMTP_PORT || "587");
const EMAIL_USER = process.env.SMTP_USER || "";
const EMAIL_PASS = process.env.SMTP_PASS || "";
const EMAIL_FROM = process.env.SMTP_FROM || "SentinelZap <noreply@sentinelzap.com>";

// Telegram configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

/**
 * Create email transporter
 */
function createEmailTransporter() {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn("[Notifications] SMTP credentials not configured");
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
}

/**
 * Send email notification
 */
export async function sendEmailNotification(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createEmailTransporter();
    if (!transporter) {
      return { success: false, error: "SMTP not configured" };
    }

    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });

    console.log(`[Notifications] Email sent to ${to}: ${subject}`);
    return { success: true };
  } catch (error: any) {
    console.error("[Notifications] Email error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send Telegram notification
 */
export async function sendTelegramNotification(
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return { success: false, error: "Telegram not configured" };
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    console.log(`[Notifications] Telegram message sent`);
    return { success: true };
  } catch (error: any) {
    console.error("[Notifications] Telegram error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Notify when chip is paused
 */
export async function notifyChipPaused(
  userId: number,
  chipName: string,
  reason: string,
  riskScore: number
): Promise<void> {
  try {
    const dbInstance = await getDb();
    if (!dbInstance) return;

    const [user] = await dbInstance
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.email) return;

    // Email notification
    const emailSubject = `⚠️ SentinelZap: Chip "${chipName}" foi pausado`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">⚠️ Alerta: Chip Pausado Automaticamente</h2>
        <p>Olá, ${user.name || "usuário"}!</p>
        <p>O chip <strong>${chipName}</strong> foi pausado automaticamente pelo sistema de Termostato.</p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Motivo:</strong> ${reason}</p>
          <p style="margin: 10px 0 0 0;"><strong>Pontuação de Risco:</strong> ${riskScore}/100</p>
        </div>
        
        <p><strong>O que fazer agora?</strong></p>
        <ul>
          <li>Aguarde até que os limites sejam resetados (meia-noite)</li>
          <li>Ou reative o chip manualmente se necessário</li>
          <li>Considere aumentar os limites diários se estiver enviando muitas mensagens</li>
        </ul>
        
        <p>Acesse o <a href="${process.env.VITE_APP_URL || "https://sentinelzap.com"}/dashboard" style="color: #2563eb;">Dashboard do SentinelZap</a> para mais detalhes.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="color: #6b7280; font-size: 12px;">
          Esta é uma notificação automática do SentinelZap. Você está recebendo este e-mail porque é o proprietário deste chip.
        </p>
      </div>
    `;

    await sendEmailNotification(user.email, emailSubject, emailHtml);

    // Telegram notification
    const telegramMessage = `
⚠️ <b>SentinelZap: Chip Pausado</b>

<b>Chip:</b> ${chipName}
<b>Motivo:</b> ${reason}
<b>Risco:</b> ${riskScore}/100

Acesse o dashboard para mais detalhes.
    `.trim();

    await sendTelegramNotification(telegramMessage);
  } catch (error) {
    console.error("[Notifications] Error sending chip paused notification:", error);
  }
}

/**
 * Notify when chip reaches 90% of daily limit
 */
export async function notifyChipNearLimit(
  userId: number,
  chipName: string,
  messagesSent: number,
  dailyLimit: number
): Promise<void> {
  try {
    const dbInstance = await getDb();
    if (!dbInstance) return;

    const [user] = await dbInstance
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.email) return;

    const percentage = Math.round((messagesSent / dailyLimit) * 100);

    // Email notification
    const emailSubject = `⚡ SentinelZap: Chip "${chipName}" atingiu ${percentage}% do limite`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">⚡ Aviso: Chip Próximo do Limite</h2>
        <p>Olá, ${user.name || "usuário"}!</p>
        <p>O chip <strong>${chipName}</strong> está próximo de atingir o limite diário de mensagens.</p>
        
        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Mensagens Enviadas:</strong> ${messagesSent} de ${dailyLimit} (${percentage}%)</p>
          <p style="margin: 10px 0 0 0;"><strong>Mensagens Restantes:</strong> ${dailyLimit - messagesSent}</p>
        </div>
        
        <p><strong>Recomendações:</strong></p>
        <ul>
          <li>O chip será pausado automaticamente ao atingir ${dailyLimit} mensagens</li>
          <li>Considere distribuir o envio entre outros chips disponíveis</li>
          <li>Ou aguarde até meia-noite para o reset automático dos contadores</li>
        </ul>
        
        <p>Acesse o <a href="${process.env.VITE_APP_URL || "https://sentinelzap.com"}/dashboard" style="color: #2563eb;">Dashboard do SentinelZap</a> para gerenciar seus chips.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="color: #6b7280; font-size: 12px;">
          Esta é uma notificação automática do SentinelZap.
        </p>
      </div>
    `;

    await sendEmailNotification(user.email, emailSubject, emailHtml);

    // Telegram notification
    const telegramMessage = `
⚡ <b>SentinelZap: Chip Próximo do Limite</b>

<b>Chip:</b> ${chipName}
<b>Enviadas:</b> ${messagesSent}/${dailyLimit} (${percentage}%)
<b>Restantes:</b> ${dailyLimit - messagesSent}

O chip será pausado ao atingir o limite.
    `.trim();

    await sendTelegramNotification(telegramMessage);
  } catch (error) {
    console.error("[Notifications] Error sending near limit notification:", error);
  }
}

/**
 * Send daily usage report
 */
export async function sendDailyReport(userId: number): Promise<void> {
  try {
    const dbInstance = await getDb();
    if (!dbInstance) return;

    const [user] = await dbInstance
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.email) return;

    // Get all chips for this user
    const { getChipsByUserId } = await import("./db");
    const chips = await getChipsByUserId(userId);

    const totalMessagesSent = chips.reduce((sum, chip) => sum + chip.messagesSentToday, 0);
    const activeChips = chips.filter((c) => c.status === "active").length;
    const pausedChips = chips.filter((c) => c.status === "paused").length;

    // Email notification
    const emailSubject = `📊 SentinelZap: Relatório Diário de Uso`;
    const chipsHtml = chips
      .map(
        (chip) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${chip.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${chip.messagesSentToday}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${chip.dailyLimit}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${chip.riskScore}/100</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <span style="color: ${chip.status === "active" ? "#16a34a" : "#dc2626"};">
            ${chip.status === "active" ? "✓ Ativo" : "⏸ Pausado"}
          </span>
        </td>
      </tr>
    `
      )
      .join("");

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h2 style="color: #2563eb;">📊 Relatório Diário de Uso - SentinelZap</h2>
        <p>Olá, ${user.name || "usuário"}!</p>
        <p>Aqui está o resumo do uso dos seus chips nas últimas 24 horas:</p>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0;">
          <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #2563eb;">${totalMessagesSent}</div>
            <div style="color: #6b7280; font-size: 14px;">Mensagens Enviadas</div>
          </div>
          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #16a34a;">${activeChips}</div>
            <div style="color: #6b7280; font-size: 14px;">Chips Ativos</div>
          </div>
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #dc2626;">${pausedChips}</div>
            <div style="color: #6b7280; font-size: 14px;">Chips Pausados</div>
          </div>
        </div>
        
        <h3>Detalhes por Chip:</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Chip</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Enviadas</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Limite</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Risco</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${chipsHtml}
          </tbody>
        </table>
        
        <p>Os contadores diários serão resetados à meia-noite automaticamente.</p>
        <p>Acesse o <a href="${process.env.VITE_APP_URL || "https://sentinelzap.com"}/dashboard" style="color: #2563eb;">Dashboard do SentinelZap</a> para mais detalhes.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="color: #6b7280; font-size: 12px;">
          Relatório automático gerado pelo SentinelZap.
        </p>
      </div>
    `;

    await sendEmailNotification(user.email, emailSubject, emailHtml);

    console.log(`[Notifications] Daily report sent to user ${userId}`);
  } catch (error) {
    console.error("[Notifications] Error sending daily report:", error);
  }
}
