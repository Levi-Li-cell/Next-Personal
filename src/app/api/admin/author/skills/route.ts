import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { authorSkill } from "@/db/schema/author";
import { eq, desc, asc } from "drizzle-orm";
import { nanoid } from "nanoid";

// GET /api/admin/author/skills - 获取技能列表
export async function GET() {
  try {
    const skills = await db
      .select()
      .from(authorSkill)
      .orderBy(asc(authorSkill.sortOrder), desc(authorSkill.createdAt));

    return NextResponse.json({
      success: true,
      data: skills,
    });
  } catch (error) {
    console.error("获取技能列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取技能列表失败" },
      { status: 500 }
    );
  }
}

// POST /api/admin/author/skills - 创建技能
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const [created] = await db
      .insert(authorSkill)
      .values({
        id: nanoid(),
        name: body.name,
        level: body.level || "80",
        category: body.category || "frontend",
        sortOrder: body.sortOrder || "0",
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: created,
      message: "技能创建成功",
    });
  } catch (error) {
    console.error("创建技能失败:", error);
    return NextResponse.json(
      { success: false, error: "创建技能失败" },
      { status: 500 }
    );
  }
}
