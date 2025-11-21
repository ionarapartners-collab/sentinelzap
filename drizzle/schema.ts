import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

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

/**
 * API Keys table for REST API authentication
 */
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  keyHash: varchar("keyHash", { length: 255 }).notNull().unique(),
  keyPrefix: varchar("keyPrefix", { length: 10 }).notNull(),
  isActive: boolean("isActive").notNull().default(true),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

/**
 * Webhook configurations table
 */
export const webhookConfigs = mysqlTable("webhook_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url").notNull(),
  events: text("events").notNull(),
  isActive: boolean("isActive").notNull().default(true),
  secret: varchar("secret", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;
export type WebhookConfig = typeof webhookConfigs.$inferSelect;
export type InsertWebhookConfig = typeof webhookConfigs.$inferInsert;

/**
 * Chips table - stores WhatsApp chip/session information
 * Supports N chips per user
 */
export const chips = mysqlTable("chips", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of this chip
  name: varchar("name", { length: 255 }).notNull(), // User-friendly name (e.g., "Chip 1", "Marketing")
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(), // WhatsApp number
  sessionId: varchar("sessionId", { length: 255 }).notNull().unique(), // Unique session identifier for WPPConnect
  
  // Status and limits
  status: mysqlEnum("status", ["active", "paused", "offline", "error"]).default("offline").notNull(),
  dailyLimit: int("dailyLimit").default(100).notNull(), // Max messages per day
  totalLimit: int("totalLimit").default(1000).notNull(), // Max messages before rotation
  
  // Thermometer (risk score)
  riskScore: int("riskScore").default(0).notNull(), // 0-100 scale
  messagesSentToday: int("messagesSentToday").default(0).notNull(),
  messagesSentTotal: int("messagesSentTotal").default(0).notNull(),
  lastMessageAt: timestamp("lastMessageAt"),
  
  // Metadata
  qrCode: text("qrCode"), // QR code for authentication
  isConnected: boolean("isConnected").default(false).notNull(),
  lastConnectedAt: timestamp("lastConnectedAt"),
  pausedReason: text("pausedReason"), // Why was it paused (e.g., "High risk score")
  
  // Warmup tracking
  warmupStatus: mysqlEnum("warmupStatus", ["not_started", "in_progress", "completed", "skipped"]).default("not_started").notNull(),
  warmupStartDate: timestamp("warmupStartDate"),
  warmupEndDate: timestamp("warmupEndDate"),
  warmupCurrentDay: int("warmupCurrentDay").default(0).notNull(), // Current day in warmup process (0-14)
  warmupMessagesToday: int("warmupMessagesToday").default(0).notNull(), // Messages sent today during warmup
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Chip = typeof chips.$inferSelect;
export type InsertChip = typeof chips.$inferInsert;

/**
 * Message history table - tracks all messages sent through the system
 */
export const messageHistory = mysqlTable("messageHistory", {
  id: int("id").autoincrement().primaryKey(),
  chipId: int("chipId").notNull(), // Which chip sent this message
  userId: int("userId").notNull(), // Owner of the chip
  
  // Message details
  recipientNumber: varchar("recipientNumber", { length: 20 }).notNull(),
  recipientName: varchar("recipientName", { length: 255 }),
  messageContent: text("messageContent").notNull(),
  messageType: mysqlEnum("messageType", ["text", "image", "video", "document", "audio"]).default("text").notNull(),
  
  // Status
  status: mysqlEnum("status", ["pending", "sent", "delivered", "read", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  
  // Timestamps
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  deliveredAt: timestamp("deliveredAt"),
  readAt: timestamp("readAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MessageHistory = typeof messageHistory.$inferSelect;
export type InsertMessageHistory = typeof messageHistory.$inferInsert;

/**
 * Conversations table - stores incoming messages for CRM view
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  chipId: int("chipId").notNull(), // Which chip received this message
  userId: int("userId").notNull(), // Owner of the chip
  
  // Contact details
  contactNumber: varchar("contactNumber", { length: 20 }).notNull(),
  contactName: varchar("contactName", { length: 255 }),
  
  // Message details
  messageContent: text("messageContent").notNull(),
  messageType: mysqlEnum("messageType", ["text", "image", "video", "document", "audio"]).default("text").notNull(),
  isFromMe: boolean("isFromMe").default(false).notNull(), // true if sent by us, false if received
  
  // Metadata
  messageId: varchar("messageId", { length: 255 }).unique(), // WhatsApp message ID
  timestamp: timestamp("timestamp").notNull(), // When the message was sent/received
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Scheduled campaigns table - stores campaigns scheduled for future execution
 */
export const scheduledCampaigns = mysqlTable("scheduled_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  messageTemplate: text("messageTemplate").notNull(),
  
  // Scheduling
  scheduledFor: timestamp("scheduledFor").notNull(),
  status: mysqlEnum("status", ["pending", "running", "completed", "cancelled", "failed"]).default("pending").notNull(),
  
  // Follow-up cadence (in days, comma-separated)
  followUpCadence: varchar("followUpCadence", { length: 100 }), // e.g., "1,3,7" = follow-up after 1, 3, and 7 days
  currentFollowUpStep: int("currentFollowUpStep").default(0).notNull(),
  
  // Contacts (JSON array of phone numbers)
  contacts: text("contacts").notNull(),
  
  // Results
  sentCount: int("sentCount").default(0).notNull(),
  failedCount: int("failedCount").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
});

export type ScheduledCampaign = typeof scheduledCampaigns.$inferSelect;
export type InsertScheduledCampaign = typeof scheduledCampaigns.$inferInsert;

/**
 * Notification settings table - stores user preferences for notifications
 */
export const notificationSettings = mysqlTable("notification_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  
  // Email settings
  emailEnabled: boolean("emailEnabled").default(false).notNull(),
  emailAddress: varchar("emailAddress", { length: 320 }),
  smtpHost: varchar("smtpHost", { length: 255 }),
  smtpPort: int("smtpPort"),
  smtpUser: varchar("smtpUser", { length: 255 }),
  smtpPassword: varchar("smtpPassword", { length: 255 }),
  
  // Telegram settings
  telegramEnabled: boolean("telegramEnabled").default(false).notNull(),
  telegramChatId: varchar("telegramChatId", { length: 100 }),
  telegramBotToken: varchar("telegramBotToken", { length: 255 }),
  
  // Notification preferences
  notifyOnChipPaused: boolean("notifyOnChipPaused").default(true).notNull(),
  notifyOnHighRisk: boolean("notifyOnHighRisk").default(true).notNull(),
  notifyOnDailyReport: boolean("notifyOnDailyReport").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = typeof notificationSettings.$inferInsert;

/**
 * Warmup settings table - global configuration for chip warmup process
 */
export const warmupSettings = mysqlTable("warmup_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  
  // Warmup duration configuration
  warmupDurationDays: int("warmupDurationDays").default(14).notNull(), // Recommended: 14 days
  
  // Messages per day for each phase
  phase1MessagesPerDay: int("phase1MessagesPerDay").default(15).notNull(), // Days 1-3
  phase2MessagesPerDay: int("phase2MessagesPerDay").default(40).notNull(), // Days 4-7
  phase3MessagesPerDay: int("phase3MessagesPerDay").default(75).notNull(), // Days 8-14
  
  // Phase duration (in days)
  phase1Duration: int("phase1Duration").default(3).notNull(),
  phase2Duration: int("phase2Duration").default(4).notNull(),
  phase3Duration: int("phase3Duration").default(7).notNull(),
  
  // Protection settings
  blockUnwarmedChips: boolean("blockUnwarmedChips").default(false).notNull(), // If true, prevent using chips that haven't completed warmup
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WarmupSettings = typeof warmupSettings.$inferSelect;
export type InsertWarmupSettings = typeof warmupSettings.$inferInsert;

/**
 * Warmup history table - tracks warmup messages sent between chips
 */
export const warmupHistory = mysqlTable("warmup_history", {
  id: int("id").autoincrement().primaryKey(),
  chipId: int("chipId").notNull(), // Chip being warmed up
  userId: int("userId").notNull(),
  
  // Message details
  senderChipId: int("senderChipId").notNull(), // Which chip sent the message (for inter-chip warmup)
  recipientNumber: varchar("recipientNumber", { length: 20 }).notNull(),
  messageContent: text("messageContent").notNull(),
  
  // Status
  status: mysqlEnum("status", ["sent", "failed"]).default("sent").notNull(),
  errorMessage: text("errorMessage"),
  
  // Warmup phase tracking
  warmupPhase: int("warmupPhase").notNull(), // 1, 2, or 3
  warmupDay: int("warmupDay").notNull(), // Day number in warmup process (1-14)
  
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export type WarmupHistory = typeof warmupHistory.$inferSelect;
export type InsertWarmupHistory = typeof warmupHistory.$inferInsert;
