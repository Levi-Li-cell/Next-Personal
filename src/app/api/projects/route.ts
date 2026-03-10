import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { project } from "@/db/schema/project";
import { eq, desc, like, and, sql } from "drizzle-orm";

const fallbackProjects = [
  {
    id: "fallback-project-1",
    title: "作品集服务维护中",
    description: "数据服务正在恢复，稍后将展示完整项目列表。",
    techStack: ["Next.js"],
    demoUrl: null,
    githubUrl: null,
    coverImage: null,
    status: "published",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

function toProjectListFallback(item: any) {
  return {
    id: item.id,
    title: item.title,
    description: item.description || "",
    techStack: Array.isArray(item.techStack) ? item.techStack : [],
    demoUrl: item.demoUrl || null,
    githubUrl: item.githubUrl || null,
    coverImage: item.coverImage || null,
    status: item.status || "published",
    createdAt: item.createdAt || new Date(),
    updatedAt: item.updatedAt || item.createdAt || new Date(),
  };
}

// GET /api/projects - 获取项目列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const status = searchParams.get("status") || "published";

    const offset = (page - 1) * limit;

    // 构建查询条件
    const conditions = [];
    if (status !== "all") {
      conditions.push(eq(project.status, status));
    }
    if (search) {
      conditions.push(like(project.title, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 查询项目列表
    const projects = await db
      .select()
      .from(project)
      .where(whereClause)
      .orderBy(desc(project.createdAt))
      .limit(limit)
      .offset(offset);

    // 查询总数
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(project)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取项目列表失败:", error);

    try {
      const response = await fetch("https://admin.fzvtbi.cn/api/projects?page=1&limit=100&status=published", {
        cache: "no-store",
      });
      const data = await response.json();
      if (response.ok && data?.success && Array.isArray(data.data)) {
        const mapped = data.data.map(toProjectListFallback);
        return NextResponse.json({
          success: true,
          data: mapped,
          pagination: {
            page: 1,
            limit: mapped.length,
            total: mapped.length,
            totalPages: 1,
          },
          degraded: true,
        });
      }
    } catch {
      // ignore remote fallback failure
    }

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
