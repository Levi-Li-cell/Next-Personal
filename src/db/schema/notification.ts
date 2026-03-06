import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const adminNotification = pgTable("admin_notification", {
  id: text("id").primaryKey(),
  userName: text("user_name").notNull(),
  userEmail: text("user_email").notNull(),
  eventType: text("event_type").notNull().default("user_signup"),
  title: text("title"),
  content: text("content"),
  link: text("link"),
  targetUserId: text("target_user_id"),
  audience: text("audience").notNull().default("admin"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}).enableRLS();

export type AdminNotificationType = typeof adminNotification.$inferSelect;
