import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { authorEducation } from "@/db/schema/author";
import { eq, desc, asc } from "drizzle-orm";
import { nanoid } from "nanoid";

// GET /api/admin/author/education - 获取教育经历列表
export async function GET() {
  try {
    const education = await db
      .select()
      .from(authorEducation)
      .orderBy(asc(authorEducation.sortOrder), desc(authorEducation.createdAt));

    return NextResponse.json({
      success: true,
      data: education,
    });
  } catch (error) {
    console.error("获取教育经历失败:", error);
    return NextResponse.json(
      { success: false, error: "获取教育经历失败" },
      { status: 500 }
    );
  }
}

// POST /api/admin/author/education - 创建教育经历
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const [created] = await db
      .insert(authorEducation)
      .values({
        id: nanoid(),
        school: body.school,
        major: body.major,
        degree: body.degree,
        startDate: body.startDate,
        endDate: body.endDate,
        description: body.description,
        achievements: body.achievements || [],
        sortOrder: body.sortOrder || "0",
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: created,
      message: "教育经历创建成功",
    });
  } catch (error) {
    console.error("创建教育经历失败:", error);
    return NextResponse.json(
      { success: false, error: "创建教育经历失败" },
      { status: 500 }
    );
  }
}
