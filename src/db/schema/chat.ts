import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const chatMessages = pgTable("chat_messages", {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: varchar("session_id", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 }).notNull(), // 'user' or 'assistant'
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
