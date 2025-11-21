import { and, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  chips, 
  InsertChip, 
  Chip,
  messageHistory,
  InsertMessageHistory,
  MessageHistory,
  conversations,
  InsertConversation,
  Conversation
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================
// USER FUNCTIONS
// ============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================
// CHIP FUNCTIONS
// ============================================

export async function createChip(chip: InsertChip): Promise<Chip> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(chips).values(chip);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(chips).where(eq(chips.id, insertedId)).limit(1);
  return inserted[0];
}

export async function getChipsByUserId(userId: number): Promise<Chip[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(chips).where(eq(chips.userId, userId));
}

export async function getChipById(chipId: number): Promise<Chip | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(chips).where(eq(chips.id, chipId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateChip(chipId: number, updates: Partial<InsertChip>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(chips).set(updates).where(eq(chips.id, chipId));
}

export async function deleteChip(chipId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(chips).where(eq(chips.id, chipId));
}

export async function getActiveChipsByUserId(userId: number): Promise<Chip[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(chips).where(
    and(
      eq(chips.userId, userId),
      eq(chips.status, "active")
    )
  );
}

export async function resetDailyCounters(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(chips).set({ messagesSentToday: 0 });
}

// ============================================
// MESSAGE HISTORY FUNCTIONS
// ============================================

export async function createMessageHistory(message: InsertMessageHistory): Promise<MessageHistory> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(messageHistory).values(message);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(messageHistory).where(eq(messageHistory.id, insertedId)).limit(1);
  return inserted[0];
}

export async function getMessageHistoryByUserId(userId: number, limit: number = 100): Promise<MessageHistory[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(messageHistory)
    .where(eq(messageHistory.userId, userId))
    .orderBy(desc(messageHistory.sentAt))
    .limit(limit);
}

export async function getMessageHistoryByChipId(chipId: number, limit: number = 100): Promise<MessageHistory[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(messageHistory)
    .where(eq(messageHistory.chipId, chipId))
    .orderBy(desc(messageHistory.sentAt))
    .limit(limit);
}

export async function updateMessageStatus(
  messageId: number, 
  status: "pending" | "sent" | "delivered" | "read" | "failed",
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: any = { status };
  if (errorMessage) updates.errorMessage = errorMessage;
  if (status === "delivered") updates.deliveredAt = new Date();
  if (status === "read") updates.readAt = new Date();

  await db.update(messageHistory).set(updates).where(eq(messageHistory.id, messageId));
}

// ============================================
// CONVERSATION FUNCTIONS
// ============================================

export async function createConversation(conversation: InsertConversation): Promise<Conversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(conversations).values(conversation);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(conversations).where(eq(conversations.id, insertedId)).limit(1);
  return inserted[0];
}

export async function getConversationsByUserId(userId: number, limit: number = 100): Promise<Conversation[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.timestamp))
    .limit(limit);
}

export async function getConversationsByChipId(chipId: number, limit: number = 100): Promise<Conversation[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(conversations)
    .where(eq(conversations.chipId, chipId))
    .orderBy(desc(conversations.timestamp))
    .limit(limit);
}

export async function getConversationsByContact(
  userId: number, 
  contactNumber: string, 
  limit: number = 50
): Promise<Conversation[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(conversations)
    .where(
      and(
        eq(conversations.userId, userId),
        eq(conversations.contactNumber, contactNumber)
      )
    )
    .orderBy(desc(conversations.timestamp))
    .limit(limit);
}
