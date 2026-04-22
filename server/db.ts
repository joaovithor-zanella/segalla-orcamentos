import { eq, like, or, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  paymentMethods,
  quotes,
  quoteItems,
  InsertPaymentMethod,
  InsertQuote,
  InsertQuoteItem,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

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

// ─── USERS ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateUser(
  id: number,
  data: { name?: string; email?: string; role?: "user" | "admin" }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id));
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(users).where(eq(users.id, id));
}

// ─── PAYMENT METHODS ─────────────────────────────────────────────────────────

export async function getAllPaymentMethods(activeOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.active, "yes"))
      .orderBy(paymentMethods.name);
  }
  return db.select().from(paymentMethods).orderBy(paymentMethods.name);
}

export async function createPaymentMethod(data: InsertPaymentMethod) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(paymentMethods).values(data);
  return result;
}

export async function updatePaymentMethod(
  id: number,
  data: { name?: string; description?: string; active?: "yes" | "no" }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(paymentMethods).set({ ...data, updatedAt: new Date() }).where(eq(paymentMethods.id, id));
}

export async function deletePaymentMethod(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
}

// ─── QUOTES ──────────────────────────────────────────────────────────────────

export async function generateQuoteNumber(): Promise<string> {
  const db = await getDb();
  if (!db) return `ORC-${Date.now()}`;
  const year = new Date().getFullYear();
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(quotes)
    .where(like(quotes.number, `${year}-%`));
  const count = (result[0]?.count || 0) + 1;
  return `${year}-${String(count).padStart(5, "0")}`;
}

export async function createQuote(data: Omit<InsertQuote, "number">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const number = await generateQuoteNumber();
  const result = await db.insert(quotes).values({ ...data, number });
  return { id: Number(result[0].insertId), number };
}

export async function getQuotesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      id: quotes.id,
      number: quotes.number,
      customerName: quotes.customerName,
      status: quotes.status,
      totalAmount: quotes.totalAmount,
      createdAt: quotes.createdAt,
      updatedAt: quotes.updatedAt,
      paymentMethodId: quotes.paymentMethodId,
    })
    .from(quotes)
    .where(eq(quotes.userId, userId))
    .orderBy(desc(quotes.createdAt));
  return result;
}

export async function getAllQuotes() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: quotes.id,
      number: quotes.number,
      userId: quotes.userId,
      customerName: quotes.customerName,
      status: quotes.status,
      totalAmount: quotes.totalAmount,
      createdAt: quotes.createdAt,
      updatedAt: quotes.updatedAt,
    })
    .from(quotes)
    .orderBy(desc(quotes.createdAt));
}

export async function getQuoteById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  return result[0];
}

export async function updateQuote(
  id: number,
  data: {
    customerName?: string;
    customerPhone?: string;
    paymentMethodId?: number | null;
    observations?: string;
    status?: "draft" | "sent" | "approved" | "rejected";
    totalAmount?: string;
  }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(quotes).set({ ...data, updatedAt: new Date() }).where(eq(quotes.id, id));
}

export async function deleteQuote(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(quoteItems).where(eq(quoteItems.quoteId, id));
  await db.delete(quotes).where(eq(quotes.id, id));
}

// ─── QUOTE ITEMS ─────────────────────────────────────────────────────────────

export async function getQuoteItems(quoteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));
}

export async function addQuoteItem(data: InsertQuoteItem) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(quoteItems).values(data);
  return Number(result[0].insertId);
}

export async function updateQuoteItem(
  id: number,
  data: { quantity?: string; unitPrice?: string; totalPrice?: string }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(quoteItems).set(data).where(eq(quoteItems.id, id));
}

export async function removeQuoteItem(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(quoteItems).where(eq(quoteItems.id, id));
}

export async function replaceQuoteItems(quoteId: number, items: InsertQuoteItem[]) {
  const db = await getDb();
  if (!db) return;
  await db.delete(quoteItems).where(eq(quoteItems.quoteId, quoteId));
  if (items.length > 0) {
    await db.insert(quoteItems).values(items);
  }
}

export async function recalcQuoteTotal(quoteId: number) {
  const db = await getDb();
  if (!db) return;
  const items = await getQuoteItems(quoteId);
  const total = items.reduce((sum, item) => sum + parseFloat(item.totalPrice || "0"), 0);
  await db
    .update(quotes)
    .set({ totalAmount: total.toFixed(2), updatedAt: new Date() })
    .where(eq(quotes.id, quoteId));
  return total;
}
