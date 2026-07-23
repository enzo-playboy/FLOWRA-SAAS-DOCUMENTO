import { pgTable, serial, text, integer, numeric, timestamp, varchar } from "drizzle-orm/pg-core";

// 1. Tabela de Usuários / Assinantes do SaaS
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  creditBalance: integer("credit_balance").default(100).notNull(), // 100 créditos iniciais no Plano Starter
  planType: varchar("plan_type", { length: 50 }).default("starter").notNull(), // "starter" | "pro"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Tabela de Conexões com Marketplaces (OAuth2 Access Tokens)
export const marketplaceConnections = pgTable("marketplace_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  platform: varchar("platform", { length: 50 }).notNull(), // "mercadolivre" | "tiktok" | "shopee"
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Tabela de Produtos Garimpados (CJDropshipping + Cotação Fiscal)
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  cjProductId: varchar("cj_product_id", { length: 100 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  productPriceUSD: numeric("product_price_usd", { precision: 10, scale: 2 }).notNull(),
  freightPriceUSD: numeric("freight_price_usd", { precision: 10, scale: 2 }).notNull(),
  totalCostBRL: numeric("total_cost_brl", { precision: 10, scale: 2 }).notNull(), // Custo landed com imposto
  suggestedSellPriceBRL: numeric("suggested_sell_price_brl", { precision: 10, scale: 2 }).notNull(),
  netProfitBRL: numeric("net_profit_brl", { precision: 10, scale: 2 }).notNull(),
  marginPercent: numeric("margin_percent", { precision: 5, scale: 2 }).notNull(),
  viralityScore: integer("virality_score").default(90).notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Tabela de Anúncios Publicados nas Lojas dos Clientes
export const publishedListings = pgTable("published_listings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  platform: varchar("platform", { length: 50 }).notNull(), // "mercadolivre" | "tiktok" | "shopee"
  externalItemId: varchar("external_item_id", { length: 100 }),
  status: varchar("status", { length: 50 }).default("active").notNull(), // "active" | "paused" | "sold"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
