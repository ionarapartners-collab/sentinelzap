import { int, mysqlTable, text, timestamp, varchar, mysqlEnum } from "drizzle-orm/mysql-core";

/**
 * Tabela para campanhas de envio em massa
 */
export const bulkCampaigns = mysqlTable("bulk_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  messageTemplate: text("messageTemplate").notNull(),
  totalContacts: int("totalContacts").notNull().default(0),
  sentCount: int("sentCount").notNull().default(0),
  failedCount: int("failedCount").notNull().default(0),
  status: mysqlEnum("status", ["pending", "running", "completed", "paused", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
});

/**
 * Tabela para contatos de campanhas
 */
export const bulkContacts = mysqlTable("bulk_contacts", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }),
  customFields: text("customFields"), // JSON string para campos personalizados
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  chipUsedId: int("chipUsedId"),
  errorMessage: text("errorMessage"),
});

export type BulkCampaign = typeof bulkCampaigns.$inferSelect;
export type InsertBulkCampaign = typeof bulkCampaigns.$inferInsert;
export type BulkContact = typeof bulkContacts.$inferSelect;
export type InsertBulkContact = typeof bulkContacts.$inferInsert;
