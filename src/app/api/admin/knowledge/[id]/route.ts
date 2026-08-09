import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureTable();
    const { id } = await params;
    const [item] = await db.select().from(knowledge).where(eq(knowledge.id, id)).limit(1);
    if (!item) {
      return NextResponse.json({ success: false, error: "知识条目不存在" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("Failed to get knowledge:", error);
    return NextResponse.json({ success: false, error: "获取知识条目失败" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureTable();
    const { id } = await params;
    const body = await request.json();

    const patch: {
      title?: string;
      content?: string;
      category?: string;
      sortOrder?: number;
      isActive?: boolean;
      updatedAt?: Date;
    } = { updatedAt: new Date() };

    if (typeof body.title === "string") {
      const title = body.title.trim();
      if (!title) {
        return NextResponse.json({ success: false, error: "标题不能为空" }, { status: 400 });
      }
      patch.title = title;
    }
    if (typeof body.content === "string") {
      const content = body.content.trim();
      if (!content) {
        return NextResponse.json({ success: false, error: "内容不能为空" }, { status: 400 });
      }
      patch.content = content;
    }
    if (typeof body.category === "string") {
      patch.category = body.category.trim() || "general";
    }
    if (body.sortOrder !== undefined && Number.isFinite(Number(body.sortOrder))) {
      patch.sortOrder = Number(body.sortOrder);
    }
    if (typeof body.isActive === "boolean") {
      patch.isActive = body.isActive;
    }

    const [updated] = await db
      .update(knowledge)
      .set(patch)
      .where(eq(knowledge.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: "知识条目不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update knowledge:", error);
    return NextResponse.json({ success: false, error: "更新知识条目失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureTable();
    const { id } = await params;
    const [deleted] = await db.delete(knowledge).where(eq(knowledge.id, id)).returning();
    if (!deleted) {
      return NextResponse.json({ success: false, error: "知识条目不存在" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error("Failed to delete knowledge:", error);
    return NextResponse.json({ success: false, error: "删除知识条目失败" }, { status: 500 });
  }
}
