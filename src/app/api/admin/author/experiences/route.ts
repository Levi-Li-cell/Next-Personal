import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { authorExperience } from "@/db/schema/author";
import { eq, desc, asc } from "drizzle-orm";
import { nanoid } from "nanoid";

// GET /api/admin/author/experiences - 获取工作经历列表
export async function GET() {
  try {
    const experiences = await db
      .select()
      .from(authorExperience)
      .orderBy(asc(authorExperience.sortOrder), desc(authorExperience.createdAt));

    return NextResponse.json({
      success: true,
      data: experiences,
    });
  } catch (error) {
    console.error("获取工作经历失败:", error);
    return NextResponse.json(
      { success: false, error: "获取工作经历失败" },
      { status: 500 }
    );
  }
}

// POST /api/admin/author/experiences - 创建工作经历
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const [created] = await db
      .insert(authorExperience)
      .values({
        id: nanoid(),
        company: body.company,
        position: body.position,
        startDate: body.startDate,
        endDate: body.endDate,
        description: body.description,
        achievements: body.achievements || [],
        techStack: body.techStack || [],
        sortOrder: body.sortOrder || "0",
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: created,
      message: "工作经历创建成功",
    });
  } catch (error) {
    console.error("创建工作经历失败:", error);
    return NextResponse.json(
      { success: false, error: "创建工作经历失败" },
      { status: 500 }
    );
  }
}
