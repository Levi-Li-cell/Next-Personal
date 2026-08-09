import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { knowledge } from "@/db/schema/knowledge";
import { DEFAULT_KNOWLEDGE_SEEDS } from "@/lib/knowledge-seed-data";

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

export async function POST(request: NextRequest) {
  try {
    await ensureTable();
    const body = await request.json().catch(() => ({} as { force?: boolean }));
    const force = body?.force === true;

    const countResult = await db.select({ count: sql<number>`count(*)` }).from(knowledge);
    const total = Number(countResult[0]?.count || 0);

    if (total > 0 && !force) {
      return NextResponse.json({
        success: true,
        message: "知识库已有数据，跳过导入（如需覆盖请传 force: true）",
        seeded: 0,
        total,
      });
    }

    if (force && total > 0) {
      await db.execute(sql`DELETE FROM knowledge`);
    }

    const values = DEFAULT_KNOWLEDGE_SEEDS.map((item) => ({
      id: randomUUID(),
      title: item.title,
      content: item.content,
      category: item.category,
      sortOrder: item.sortOrder,
      isActive: true,
    }));

    const created = await db.insert(knowledge).values(values).returning();

    return NextResponse.json({
      success: true,
      message: force
        ? `已强制重新导入 ${created.length} 条知识库内容`
        : `已导入 ${created.length} 条知识库内容`,
      seeded: created.length,
      data: created.map((row) => ({ id: row.id, title: row.title, category: row.category })),
    });
  } catch (error) {
    console.error("Failed to seed knowledge:", error);
    return NextResponse.json({ success: false, error: "初始化知识库失败" }, { status: 500 });
  }
}
