import { pgTable, text, timestamp, json, boolean } from "drizzle-orm/pg-core";

// 作者基本信息表
export const authorProfile = pgTable("author_profile", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default("李伟"),
  title: text("title").notNull().default("前端开发师"),
  bio: text("bio"),
  gender: text("gender").default("男"),
  age: text("age").default("24"),
  phone: text("phone").default("13043428526"),
  education: text("education").default("本科"),
  location: text("location").default("江西 · 汉族"),
  preferredCity: text("preferred_city").default("全国"),
  preferredPosition: text("preferred_position").default("前端开发师"),
  expectedSalary: text("expected_salary").default("面议"),
  githubUrl: text("github_url"),
  linkedinUrl: text("linkedin_url"),
  email: text("email"),
  hobbies: json("hobbies").$type<string[]>().default([]),
  photos: json("photos").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
}).enableRLS();

// 技能表
export const authorSkill = pgTable("author_skill", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  level: text("level").notNull().default("80"), // 0-100
  category: text("category").default("frontend"), // frontend, backend, tools, etc.
  sortOrder: text("sort_order").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
}).enableRLS();

// 工作经历表
export const authorExperience = pgTable("author_experience", {
  id: text("id").primaryKey(),
  company: text("company").notNull(),
  position: text("position").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  description: text("description"),
  achievements: json("achievements").$type<string[]>().default([]),
  techStack: json("tech_stack").$type<string[]>().default([]),
  sortOrder: text("sort_order").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
}).enableRLS();

// 教育经历表
export const authorEducation = pgTable("author_education", {
  id: text("id").primaryKey(),
  school: text("school").notNull(),
  major: text("major").notNull(),
  degree: text("degree").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  description: text("description"),
  achievements: json("achievements").$type<string[]>().default([]),
  sortOrder: text("sort_order").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
}).enableRLS();

// 荣誉证书表
export const authorHonor = pgTable("author_honor", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  issuer: text("issuer"),
  date: text("date"),
  description: text("description"),
  imageUrl: text("image_url"),
  sortOrder: text("sort_order").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
}).enableRLS();

export type AuthorProfileType = typeof authorProfile.$inferSelect;
export type NewAuthorProfileType = typeof authorProfile.$inferInsert;
export type AuthorSkillType = typeof authorSkill.$inferSelect;
export type NewAuthorSkillType = typeof authorSkill.$inferInsert;
export type AuthorExperienceType = typeof authorExperience.$inferSelect;
export type NewAuthorExperienceType = typeof authorExperience.$inferInsert;
export type AuthorEducationType = typeof authorEducation.$inferSelect;
export type NewAuthorEducationType = typeof authorEducation.$inferInsert;
export type AuthorHonorType = typeof authorHonor.$inferSelect;
export type NewAuthorHonorType = typeof authorHonor.$inferInsert;
