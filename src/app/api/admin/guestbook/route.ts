import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { guestbookMessage } from "@/db/schema/guestbook";
import { and, desc, eq, like, or, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const offset = (page - 1) * limit;

    const conditions = [];
    if (status !== "all") {
      conditions.push(eq(guestbookMessage.status, status));
    }
    if (search) {
      conditions.push(
        or(
          like(guestbookMessage.name, `%${search}%`),
          like(guestbookMessage.content, `%${search}%`),
          like(guestbookMessage.contact, `%${search}%`),
          like(guestbookMessage.userName, `%${search}%`),
          like(guestbookMessage.userEmail, `%${search}%`),
          like(guestbookMessage.userId, `%${search}%`),
          like(guestbookMessage.ipAddress, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(guestbookMessage)
      .where(whereClause)
      .orderBy(desc(guestbookMessage.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(guestbookMessage)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取留言失败:", error);
    return NextResponse.json({ success: false, error: "获取留言失败" }, { status: 500 });
  }
}
