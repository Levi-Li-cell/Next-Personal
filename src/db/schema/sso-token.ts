import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const ssoToken = pgTable("sso_token", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: text("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
