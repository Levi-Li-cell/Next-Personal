import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const knowledge = pgTable("knowledge", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("general"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
}).enableRLS();

export type KnowledgeType = typeof knowledge.$inferSelect;
export type NewKnowledgeType = typeof knowledge.$inferInsert;
