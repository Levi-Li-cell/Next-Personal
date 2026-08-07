import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { project } from "@/db/schema/project";
import { htmlToMarkdown } from "@/lib/admin/markdown";
import { createPublicNotification } from "@/lib/notifications/public-notify";

function normalizeAudience(value: string | undefined) {
  return value === "hr" || value === "client" ? value : "both";
}

function normalizeCta(value: string | undefined) {
  return value === "hr" || value === "client" ? value : "both";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search");
    const status = searchParams.get("status") || "all";
    const audience = searchParams.get("audience");
    const featured = searchParams.get("featured");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (status !== "all") conditions.push(eq(project.status, status));
    if (audience && audience !== "all") conditions.push(eq(project.targetAudience, audience));
    if (featured === "true") conditions.push(eq(project.featured, true));
    if (search) conditions.push(or(like(project.title, `%${search}%`), like(project.description, `%${search}%`)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const projects = await db.select().from(project).where(whereClause).orderBy(desc(project.featured), desc(project.createdAt)).limit(limit).offset(offset);
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(project).where(whereClause);

    return NextResponse.json({
      success: true,
      data: projects,
      pagination: {
        page,
        limit,
        total: Number(countResult[0]?.count || 0),
        totalPages: Math.ceil(Number(countResult[0]?.count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin projects:", error);
    return NextResponse.json({ success: false, error: "获取项目列表失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const contentHtml = String(body.content || "");
    const markdownContent = htmlToMarkdown(contentHtml);

    const [newProject] = await db
      .insert(project)
      .values({
        id: randomUUID(),
        title: body.title,
        description: body.description,
        content: markdownContent,
        coverImage: body.coverImage,
        techStack: body.techStack || [],
        targetAudience: normalizeAudience(body.targetAudience),
        ctaType: normalizeCta(body.ctaType),
        featured: Boolean(body.featured),
        demoUrl: body.demoUrl,
        githubUrl: body.githubUrl,
        status: body.status || "draft",
        publishedAt: body.status === "published" ? new Date() : null,
      })
      .returning();

    if (newProject.status === "published") {
      await createPublicNotification({
        eventType: "project_published",
        title: `新项目上线：${newProject.title}`,
        content: newProject.description || "点击查看项目详情",
        link: `/projects/${newProject.id}`,
      });
    }

    return NextResponse.json({ success: true, data: newProject });
  } catch (error) {
    console.error("Failed to create admin project:", error);
    return NextResponse.json({ success: false, error: "创建项目失败" }, { status: 500 });
  }
}
