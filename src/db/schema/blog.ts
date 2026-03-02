import { pgTable, text, timestamp, json, boolean, integer } from "drizzle-orm/pg-core";
import { user } from "./auth/user";

// 博客文章表
export const blog = pgTable("blog", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  category: text("category").notNull().default("未分类"),
  tags: json("tags").$type<string[]>().default([]),
  authorId: text("author_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("draft"), // draft, published
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
  publishedAt: timestamp("published_at"),
}).enableRLS();

export type BlogType = typeof blog.$inferSelect;
export type NewBlogType = typeof blog.$inferInsert;
