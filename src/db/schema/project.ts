import { boolean, json, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const project = pgTable("project", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content"),
  coverImage: text("cover_image"),
  imageLinks: jsonb("image_links").$type<string[]>().default([]),
  techStack: json("tech_stack").$type<string[]>().default([]),
  targetAudience: text("target_audience").notNull().default("both"),
  ctaType: text("cta_type").notNull().default("both"),
  featured: boolean("featured").notNull().default(false),
  demoUrl: text("demo_url"),
  githubUrl: text("github_url"),
  status: text("status").notNull().default("draft"),
  sortOrder: text("sort_order").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
  publishedAt: timestamp("published_at"),
}).enableRLS();

export type ProjectType = typeof project.$inferSelect;
export type NewProjectType = typeof project.$inferInsert;
