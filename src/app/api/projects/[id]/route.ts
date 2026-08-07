import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { project } from "@/db/schema/project";
import { deleteBlobUrls } from "@/lib/admin/blob";
import { createPublicNotification } from "@/lib/notifications/public-notify";
import { extractImageUrlsFromHtml, extractImageUrlsFromMarkdown, htmlToMarkdown } from "@/lib/admin/markdown";

const fallbackProjectDetail = (id: string) => ({
  id,
  title: "作品详情维护中",
  description: "项目数据服务正在恢复，稍后展示完整内容。",
  content: "# 服务维护中\n\n当前数据库连接不可用，已自动切换为降级内容。",
  coverImage: null,
  techStack: ["Next.js"],
  targetAudience: "both",
  ctaType: "both",
  featured: true,
  demoUrl: null,
  githubUrl: null,
  status: "published",
  createdAt: new Date(),
  updatedAt: new Date(),
});

function normalizeAudience(value: string | undefined) {
  return value === "hr" || value === "client" ? value : "both";
}

function normalizeCta(value: string | undefined) {
  return value === "hr" || value === "client" ? value : "both";
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const projectItem = await db.select().from(project).where(eq(project.id, id)).limit(1);
    if (!projectItem[0]) {
      return NextResponse.json({ success: false, error: "项目不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: projectItem[0] });
  } catch (error) {
    console.error("Failed to fetch project detail:", error);
    const { id } = await params;
    return NextResponse.json({ success: true, data: fallbackProjectDetail(id), degraded: true });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.select().from(project).where(eq(project.id, id)).limit(1);
    if (!existing[0]) {
      return NextResponse.json({ success: false, error: "项目不存在" }, { status: 404 });
    }

    const contentHtml = String(body.content || "");
    const nextContent = htmlToMarkdown(contentHtml);
    const nextImageLinks = [...new Set([...extractImageUrlsFromHtml(contentHtml), body.coverImage].filter(Boolean))];
    const previousImageLinks = extractImageUrlsFromMarkdown(String(existing[0].content || ""));
    const removedImageLinks = previousImageLinks.filter((url) => !nextImageLinks.includes(url));
    await deleteBlobUrls(removedImageLinks);

    const updated = await db
      .update(project)
      .set({
        title: body.title,
        description: body.description,
        content: nextContent,
        coverImage: body.coverImage,
        techStack: body.techStack || [],
        targetAudience: normalizeAudience(body.targetAudience),
        ctaType: normalizeCta(body.ctaType),
        featured: Boolean(body.featured),
        demoUrl: body.demoUrl,
        githubUrl: body.githubUrl,
        status: body.status,
        publishedAt: body.status === "published" ? new Date() : null,
      })
      .where(eq(project.id, id))
      .returning();

    const previousStatus = existing[0].status;
    const current = updated[0];
    if (current?.status === "published" && previousStatus !== "published") {
      await createPublicNotification({
        eventType: "project_published",
        title: `新项目上线：${current.title}`,
        content: current.description || "点击查看项目详情",
        link: `/projects/${current.id}`,
      });
    }

    return NextResponse.json({ success: true, data: current });
  } catch (error) {
    console.error("Failed to update project:", error);
    return NextResponse.json({ success: false, error: "更新项目失败" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await db.select().from(project).where(eq(project.id, id)).limit(1);
    if (!existing[0]) {
      return NextResponse.json({ success: false, error: "项目不存在" }, { status: 404 });
    }

    const imageLinks = extractImageUrlsFromMarkdown(String(existing[0].content || ""));
    await deleteBlobUrls(imageLinks);
    await db.delete(project).where(eq(project.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return NextResponse.json({ success: false, error: "删除项目失败" }, { status: 500 });
  }
}
