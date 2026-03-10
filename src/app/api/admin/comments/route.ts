import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blogComment } from "@/db/schema/blog";
import { user } from "@/db/schema/auth/user";
import { blog } from "@/db/schema/blog";
import { eq, desc, like, and, sql, or } from "drizzle-orm";

// GET /api/admin/comments - 获取评论列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const status = searchParams.get("status") || "all";

    const offset = (page - 1) * limit;

    // 构建查询条件
    const conditions = [];
    if (status !== "all") {
      conditions.push(eq(blogComment.status, status));
    }
    if (search) {
      conditions.push(like(blogComment.content, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 查询评论列表（关联用户和博客）
    const comments = await db
      .select({
        id: blogComment.id,
        content: blogComment.content,
        status: blogComment.status,
        createdAt: blogComment.createdAt,
        blogId: blogComment.blogId,
        userId: blogComment.userId,
        parentId: blogComment.parentId,
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
        blog: {
          id: blog.id,
          title: blog.title,
          slug: blog.slug,
        },
      })
      .from(blogComment)
      .leftJoin(user, eq(blogComment.userId, user.id))
      .leftJoin(blog, eq(blogComment.blogId, blog.id))
      .where(whereClause)
      .orderBy(desc(blogComment.createdAt))
      .limit(limit)
      .offset(offset);

    // 查询总数
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(blogComment)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取评论列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取评论列表失败" },
      { status: 500 }
    );
  }
}
