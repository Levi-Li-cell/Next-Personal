import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { sql } from "drizzle-orm";
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

export async function POST() {
  try {
    await ensureTable();
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(knowledge);
    const total = Number(countResult[0]?.count || 0);
    if (total > 0) {
      return NextResponse.json({
        success: true,
        message: "知识库已有数据，跳过初始化",
        seeded: 0,
      });
    }

    const dir = path.join(process.cwd(), "src/lib/knowledge");
    const seeds: Array<{ title: string; content: string; category: string; sortOrder: number }> = [];

    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md") || f.endsWith(".txt"));
      files.forEach((file, index) => {
        const content = fs.readFileSync(path.join(dir, file), "utf-8").trim();
        if (!content) return;
        seeds.push({
          title: file.replace(/\.(md|txt)$/i, ""),
          content,
          category: file.includes("backend") ? "backend" : file.includes("resume") || file.includes("xinxi") ? "resume" : "general",
          sortOrder: index,
        });
      });
    }

    if (!seeds.length) {
      return NextResponse.json({ success: false, error: "未找到本地知识库文件" }, { status: 404 });
    }

    const values = seeds.map((item) => ({
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
      message: `已导入 ${created.length} 条知识库内容`,
      seeded: created.length,
      data: created,
    });
  } catch (error) {
    console.error("Failed to seed knowledge:", error);
    return NextResponse.json({ success: false, error: "初始化知识库失败" }, { status: 500 });
  }
}
