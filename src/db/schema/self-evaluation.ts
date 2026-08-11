import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const selfEvaluation = pgTable("self_evaluation", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
}).enableRLS();

export type SelfEvaluationType = typeof selfEvaluation.$inferSelect;
export type NewSelfEvaluationType = typeof selfEvaluation.$inferInsert;
