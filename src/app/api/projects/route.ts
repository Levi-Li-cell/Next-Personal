import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { project } from "@/db/schema/project";

const fallbackProjects = [
  {
    id: "fallback-project-1",
    title: "作品集服务维护中",
    description: "数据服务正在恢复，稍后将展示完整项目列表。",
    techStack: ["Next.js"],
    demoUrl: null,
    githubUrl: null,
    coverImage: null,
    targetAudience: "both",
    ctaType: "both",
    featured: true,
    status: "published",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search");
    const status = searchParams.get("status") || "published";
    const audience = searchParams.get("audience");
    const featured = searchParams.get("featured");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (status !== "all") conditions.push(eq(project.status, status));
    if (search) conditions.push(or(like(project.title, `%${search}%`), like(project.description, `%${search}%`)));
    if (audience && audience !== "all") conditions.push(or(eq(project.targetAudience, audience), eq(project.targetAudience, "both")));
    if (featured === "true") conditions.push(eq(project.featured, true));

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
    console.error("Failed to fetch projects:", error);

    return NextResponse.json({
      success: true,
      data: fallbackProjects,
      pagination: {
        page: 1,
        limit: fallbackProjects.length,
        total: fallbackProjects.length,
        totalPages: 1,
      },
      degraded: true,
    });
  }
}
