import { pgTable, text, timestamp, json } from "drizzle-orm/pg-core";

// 项目表
export const project = pgTable("project", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content"), // 详细介绍（Markdown）
  coverImage: text("cover_image"),
  techStack: json("tech_stack").$type<string[]>().default([]),
  demoUrl: text("demo_url"),
  githubUrl: text("github_url"),
  status: text("status").notNull().default("draft"), // draft, published
  sortOrder: text("sort_order").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
  publishedAt: timestamp("published_at"),
}).enableRLS();

export type ProjectType = typeof project.$inferSelect;
export type NewProjectType = typeof project.$inferInsert;
