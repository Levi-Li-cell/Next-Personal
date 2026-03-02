import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

// 照片/相册表
export const photo = pgTable("photo", {
  id: text("id").primaryKey(),
  title: text("title"),
  description: text("description"),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  album: text("album").default("默认相册"),
  tags: text("tags"),
  status: text("status").notNull().default("published"), // draft, published
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
}).enableRLS();

export type PhotoType = typeof photo.$inferSelect;
export type NewPhotoType = typeof photo.$inferInsert;
