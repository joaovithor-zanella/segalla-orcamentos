import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Para autenticação local: use username + passwordHash
 * Para OAuth: use openId
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // OAuth ID (opcional para auth local)
  username: varchar("username", { length: 100 }).unique(), // Para autenticação local
  passwordHash: varchar("passwordHash", { length: 255 }), // Hash da senha (bcrypt)
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }), // "local" ou "oauth"
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  canViewOtherQuotes: mysqlEnum("canViewOtherQuotes", ["yes", "no"]).default("no").notNull(), // Permissão para ver orçamentos de outros
  active: mysqlEnum("active", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Formas de pagamento cadastradas pelo administrador.
 */
export const paymentMethods = mysqlTable("payment_methods", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  active: mysqlEnum("active", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;

/**
 * Informações de veículo associadas aos orçamentos.
 */
export const vehicleInfo = mysqlTable("vehicle_info", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quoteId").unique(),
  plate: varchar("plate", { length: 20 }), // Placa do veículo
  model: varchar("model", { length: 100 }), // Modelo do veículo
  year: int("year"), // Ano do veículo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VehicleInfo = typeof vehicleInfo.$inferSelect;
export type InsertVehicleInfo = typeof vehicleInfo.$inferInsert;

/**
 * Orçamentos criados pelos usuários.
 */
export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  number: varchar("number", { length: 20 }).notNull().unique(),
  userId: int("userId").notNull(),
  customerName: varchar("customerName", { length: 200 }),
  customerPhone: varchar("customerPhone", { length: 30 }),
  paymentMethodId: int("paymentMethodId"),
  observations: text("observations"),
  status: mysqlEnum("status", ["draft", "sent", "approved", "rejected"]).default("draft").notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;

/**
 * Itens de cada orçamento.
 */
export const quoteItems = mysqlTable("quote_items", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quoteId").notNull(),
  productCode: varchar("productCode", { length: 60 }).notNull(),
  productName: varchar("productName", { length: 300 }).notNull(),
  productBrand: varchar("productBrand", { length: 120 }),
  company: varchar("company", { length: 100 }), // Nome da empresa/filial
  companyId: int("companyId"), // ID da empresa (1-5)
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1.00"),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalPrice: decimal("totalPrice", { precision: 12, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertQuoteItem = typeof quoteItems.$inferInsert;
