import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const lead = pgTable("lead", {
  id: text("id").primaryKey(),
  type: text("type").notNull().default("client"), // hr | client
  status: text("status").notNull().default("new"), // new | contacted | in_progress | closed
  name: text("name").notNull(),
  company: text("company"),
  email: text("email"),
  phone: text("phone"),
  jobTitle: text("job_title"),
  projectType: text("project_type"),
  budgetRange: text("budget_range"),
  timeline: text("timeline"),
  sourcePage: text("source_page"),
  sourceSection: text("source_section"), // direct | blog_cta | project_cta | guestbook_redirect | blog_comment
  message: text("message").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
}).enableRLS();

export type LeadType = typeof lead.$inferSelect;
export type NewLeadType = typeof lead.$inferInsert;
