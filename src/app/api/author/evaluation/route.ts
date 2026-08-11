import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { selfEvaluation } from "@/db/schema/self-evaluation";
import { eq, sql, asc } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/get-session";
import { nanoid } from "nanoid";

async function ensureTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS self_evaluation (
      id text PRIMARY KEY,
      content text NOT NULL,
      sort_order integer DEFAULT 0 NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    )
  `);
}

const FALLBACK = [
  "本人性格踏实稳重，严谨务实、有较强的抗压能力",
  "设计上具备良好的审美能力，有良好的代码编程习惯",
  "对互联网行业有较强的学习热情和自学能力，有较强的独立思考能力",
  "乐于在开发者社区Github上交流学习，将新的知识纳入自己的知识体系中",
  "擅于团队协作开发，沟通交流，有意进入贵司成为开发岗中的一员",
];

export async function GET() {
  try {
    await ensureTable();
    const items = await db
      .select({ id: selfEvaluation.id, content: selfEvaluation.content, sortOrder: selfEvaluation.sortOrder })
      .from(selfEvaluation)
      .orderBy(asc(selfEvaluation.sortOrder));

    if (items.length === 0) {
      return NextResponse.json({ success: true, data: FALLBACK.map((content, i) => ({ id: `fallback-${i}`, content, sortOrder: i })) });
    }

    return NextResponse.json({ success: true, data: items.map((item) => ({ id: item.id, content: item.content, sortOrder: item.sortOrder })) });
  } catch (error) {
    console.error("Failed to fetch self-evaluation:", error);
    return NextResponse.json({ success: true, data: FALLBACK.map((content, i) => ({ id: `fallback-${i}`, content, sortOrder: i })) });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    await ensureTable();
    const body = await request.json();
    const { items } = body as { items: Array<{ id?: string; content: string; sortOrder?: number }> };

    if (!Array.isArray(items)) {
      return NextResponse.json({ success: false, error: "参数格式错误" }, { status: 400 });
    }

    // 清空旧数据
    await db.execute(sql`DELETE FROM self_evaluation`);

    // 插入新数据
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.content && item.content.trim()) {
        await db.insert(selfEvaluation).values({
          id: nanoid(),
          content: item.content.trim(),
          sortOrder: item.sortOrder ?? i,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update self-evaluation:", error);
    return NextResponse.json({ success: false, error: "更新失败" }, { status: 500 });
  }
}
