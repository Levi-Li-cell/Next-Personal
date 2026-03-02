import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blog } from "@/db/schema/blog";
import { eq, sql } from "drizzle-orm";

// GET /api/blog/[slug] - 获取单篇博客
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const blogPost = await db
      .select()
      .from(blog)
      .where(eq(blog.slug, slug))
      .limit(1);

    if (!blogPost[0]) {
      return NextResponse.json(
        { success: false, error: "博客不存在" },
        { status: 404 }
      );
    }

    // 增加阅读量
    await db
      .update(blog)
      .set({ viewCount: sql`${blog.viewCount} + 1` })
      .where(eq(blog.id, blogPost[0].id));

    return NextResponse.json({
      success: true,
      data: {
        ...blogPost[0],
        viewCount: (blogPost[0].viewCount || 0) + 1,
      },
    });
  } catch (error) {
    console.error("获取博客详情失败:", error);
    return NextResponse.json(
      { success: false, error: "获取博客详情失败" },
      { status: 500 }
    );
  }
}
