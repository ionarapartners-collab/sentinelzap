import { int, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * API Keys table for REST API authentication
 */
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // Nome descritivo da key (ex: "Make Integration")
  keyHash: varchar("keyHash", { length: 255 }).notNull().unique(), // Hash SHA256 da API key
  keyPrefix: varchar("keyPrefix", { length: 10 }).notNull(), // Primeiros 8 caracteres para identificação
  isActive: boolean("isActive").notNull().default(true),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // Null = nunca expira
});

/**
 * Webhook configurations table
 */
export const webhookConfigs = mysqlTable("webhook_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url").notNull(), // URL do Make para receber webhooks
  events: text("events").notNull(), // JSON array de eventos: ["message.received", "message.sent", "chip.paused"]
  isActive: boolean("isActive").notNull().default(true),
  secret: varchar("secret", { length: 255 }), // Secret para validar webhooks
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;
export type WebhookConfig = typeof webhookConfigs.$inferSelect;
export type InsertWebhookConfig = typeof webhookConfigs.$inferInsert;
