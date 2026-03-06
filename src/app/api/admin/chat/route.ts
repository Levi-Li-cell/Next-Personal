import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages } from "@/db/schema/chat";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100);
    const role = String(searchParams.get("role") || "all").trim();
    const search = String(searchParams.get("search") || "").trim();
    const offset = (page - 1) * limit;

    const conditions = [];
    if (role !== "all") {
      conditions.push(eq(chatMessages.role, role));
    }
    if (search) {
      conditions.push(
        or(
          ilike(chatMessages.content, `%${search}%`),
          ilike(chatMessages.sessionId, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select()
      .from(chatMessages)
      .where(whereClause)
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取聊天记录失败:", error);
    return NextResponse.json({ success: false, error: "获取聊天记录失败" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = String(searchParams.get("sessionId") || "").trim();

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "缺少会话ID" }, { status: 400 });
    }

    await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除聊天会话失败:", error);
    return NextResponse.json({ success: false, error: "删除聊天会话失败" }, { status: 500 });
  }
}
