import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth/user";

export const guestbookMessage = pgTable("guestbook_message", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  userName: text("user_name"),
  userEmail: text("user_email"),
  userImage: text("user_image"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  name: text("name").notNull(),
  content: text("content").notNull(),
  contact: text("contact"),
  status: text("status").notNull().default("approved"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
}).enableRLS();

export type GuestbookMessageType = typeof guestbookMessage.$inferSelect;
export type NewGuestbookMessageType = typeof guestbookMessage.$inferInsert;
