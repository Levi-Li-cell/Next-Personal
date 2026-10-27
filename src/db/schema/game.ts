import { integer, jsonb, pgTable, text, timestamp, uniqueIndex, type AnyPgColumn } from "drizzle-orm/pg-core";
import { user } from "./auth/user";

/**
 * 互动作品表：一个作品 = 一个可在 WebGL 画布里运行的交互场景。
 * 统计字段（浏览/下载/评论数、评分和/次数）为反范式冗余，列表页免聚合查询；
 * 评分明细以 interactive_rating 为准，提交评分时同步维护。
 */
export const interactiveWork = pgTable("interactive_work", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  tagline: text("tagline"),
  description: text("description").notNull(),
  authorName: text("author_name").notNull().default("李伟"),
  authorLink: text("author_link"),
  tags: jsonb("tags").$type<string[]>().default([]),
  coverImage: text("cover_image"),
  /** 无封面图时的 CSS 渐变（列表卡片占位封面） */
  coverGradient: text("cover_gradient"),
  sceneType: text("scene_type").notNull().default("crystal-cluster"),
  sceneConfig: jsonb("scene_config").$type<Record<string, unknown>>().default({}),
  controlsHint: jsonb("controls_hint").$type<string[]>().default([]),
  status: text("status").notNull().default("published"),
  viewCount: integer("view_count").notNull().default(0),
  downloadCount: integer("download_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  ratingSum: integer("rating_sum").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
  publishedAt: timestamp("published_at").defaultNow(),
}).enableRLS();

/**
 * 评分表：每个 voterKey 对同一作品仅一条记录（可改分）。
 * voterKey = "user:{userId}"（登录）或 "guest:{visitorId}"（游客，localStorage 生成）。
 */
export const interactiveRating = pgTable("interactive_rating", {
  id: text("id").primaryKey(),
  workId: text("work_id").notNull().references(() => interactiveWork.id, { onDelete: "cascade" }),
  voterKey: text("voter_key").notNull(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  score: integer("score").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  voterUnique: uniqueIndex("interactive_rating_work_voter_unique").on(table.workId, table.voterKey),
})).enableRLS();

/**
 * 评论表：parent_id 自关联形成一层回复树（与 blog_comment 同构）。
 * 游客评论以 guestName 展示，登录评论冗余 userId 便于后台管理。
 */
export const interactiveComment = pgTable("interactive_comment", {
  id: text("id").primaryKey(),
  workId: text("work_id").notNull().references(() => interactiveWork.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  guestName: text("guest_name"),
  parentId: text("parent_id").references((): AnyPgColumn => interactiveComment.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  likeCount: integer("like_count").notNull().default(0),
  status: text("status").notNull().default("approved"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
}).enableRLS();

/** 评论点赞表：与评分同源的 voterKey 去重，POST 切换点赞/取消 */
export const interactiveCommentLike = pgTable("interactive_comment_like", {
  id: text("id").primaryKey(),
  commentId: text("comment_id").notNull().references(() => interactiveComment.id, { onDelete: "cascade" }),
  voterKey: text("voter_key").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  voterUnique: uniqueIndex("interactive_comment_like_unique").on(table.commentId, table.voterKey),
})).enableRLS();

export type InteractiveWorkType = typeof interactiveWork.$inferSelect;
export type NewInteractiveWorkType = typeof interactiveWork.$inferInsert;
export type InteractiveRatingType = typeof interactiveRating.$inferSelect;
export type InteractiveCommentType = typeof interactiveComment.$inferSelect;
export type InteractiveCommentLikeType = typeof interactiveCommentLike.$inferSelect;
