import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { blog } from "@/db/schema/blog";
import { createPublicNotification } from "@/lib/notifications/public-notify";

const ANNOUNCEMENT_CATEGORY = "公告";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const title = String(body.title || "").trim();
    const excerpt = String(body.excerpt || "").trim();
    const content = String(body.content || "").trim();
    const status = String(body.status || "draft").trim() || "draft";
    const coverImage = String(body.coverImage || "").trim() || null;

    const [existing] = await db
      .select()
      .from(blog)
      .where(and(eq(blog.id, id), eq(blog.category, ANNOUNCEMENT_CATEGORY)));

    if (!existing) {
      return NextResponse.json({ success: false, error: "公告不存在" }, { status: 404 });
    }

    const [updated] = await db
      .update(blog)
      .set({
        title,
        excerpt,
        content,
        coverImage,
        imageLinks: coverImage ? [coverImage] : [],
        status,
        publishedAt: status === "published" ? new Date() : null,
      })
      .where(eq(blog.id, id))
      .returning();

    if (existing.status !== "published" && updated.status === "published") {
      await createPublicNotification({
        eventType: "announcement",
        title: `站点公告：${updated.title}`,
        content: updated.excerpt || "点击查看公告详情",
        link: `/blog/${updated.slug}`,
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("更新公告失败:", error);
    return NextResponse.json({ success: false, error: "更新公告失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [deleted] = await db
      .delete(blog)
      .where(and(eq(blog.id, id), eq(blog.category, ANNOUNCEMENT_CATEGORY)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ success: false, error: "公告不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error("删除公告失败:", error);
    return NextResponse.json({ success: false, error: "删除公告失败" }, { status: 500 });
  }
}
