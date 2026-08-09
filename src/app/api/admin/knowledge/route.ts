import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { knowledge } from "@/db/schema/knowledge";

async function ensureTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS knowledge (
      id text PRIMARY KEY,
      title text NOT NULL,
      content text NOT NULL,
      category text NOT NULL DEFAULT 'general',
      sort_order integer NOT NULL DEFAULT 0,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now()
    )
  `);
}

export async function GET(request: NextRequest) {
  try {
    await ensureTable();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search");
    const category = searchParams.get("category") || "all";
    const offset = (page - 1) * limit;

    const conditions = [];
    if (category !== "all") conditions.push(eq(knowledge.category, category));
    if (search) {
      conditions.push(
        or(
          like(knowledge.title, `%${search}%`),
          like(knowledge.content, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(knowledge)
      .where(whereClause)
      .orderBy(asc(knowledge.sortOrder), desc(knowledge.updatedAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(knowledge)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("Failed to fetch knowledge:", error);
    return NextResponse.json(
      { success: false, error: "获取知识库失败，请检查数据库连接" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTable();
    const body = await request.json();
    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    const category = String(body.category || "general").trim() || "general";
    const sortOrder = Number.isFinite(Number(body.sortOrder))
      ? Number(body.sortOrder)
      : 0;
    const isActive = body.isActive !== false;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "标题和内容不能为空" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(knowledge)
      .values({
        id: randomUUID(),
        title,
        content,
        category,
        sortOrder,
        isActive,
      })
      .returning();

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("Failed to create knowledge:", error);
    return NextResponse.json(
      { success: false, error: "创建知识条目失败" },
      { status: 500 }
    );
  }
}
