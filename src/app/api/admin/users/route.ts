import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema/auth/user";
import { eq, desc, like, and, sql, or } from "drizzle-orm";

// GET /api/admin/users - 获取用户列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const role = searchParams.get("role");

    const offset = (page - 1) * limit;

    // 构建查询条件
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(user.name, `%${search}%`),
          like(user.email, `%${search}%`),
          like(user.username, `%${search}%`)
        )
      );
    }
    if (role && role !== "all") {
      conditions.push(eq(user.role, role));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 查询用户列表
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        image: user.image,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(whereClause)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);

    // 查询总数
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page: page - 1, // 前端使用 0-based 索引
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取用户列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取用户列表失败" },
      { status: 500 }
    );
  }
}
