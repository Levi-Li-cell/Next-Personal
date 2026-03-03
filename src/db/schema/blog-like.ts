import { pgTable, text, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth/user";
import { blog } from "./blog";

// 博客点赞表
export const blogLike = pgTable("blog_like", {
  id: text("id").primaryKey(),
  blogId: text("blog_id").notNull().references(() => blog.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // 创建唯一索引，确保用户对同一篇文章只能点赞一次
  blogLikeUniqueIndex: uniqueIndex("blog_like_blog_user_unique").on(table.blogId, table.userId),
})).enableRLS();

export type BlogLikeType = typeof blogLike.$inferSelect;
export type NewBlogLikeType = typeof blogLike.$inferInsert;