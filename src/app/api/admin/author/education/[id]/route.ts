import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { authorEducation } from "@/db/schema/author";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(authorEducation)
      .set({
        school: body.school,
        major: body.major,
        degree: body.degree,
        startDate: body.startDate,
        endDate: body.endDate,
        description: body.description,
        achievements: body.achievements || [],
        sortOrder: body.sortOrder || "0",
        updatedAt: new Date(),
      })
      .where(eq(authorEducation.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: "教育经历不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("更新教育经历失败:", error);
    return NextResponse.json({ success: false, error: "更新教育经历失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await db
      .delete(authorEducation)
      .where(eq(authorEducation.id, id))
      .returning({ id: authorEducation.id });

    if (!deleted[0]) {
      return NextResponse.json({ success: false, error: "教育经历不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除教育经历失败:", error);
    return NextResponse.json({ success: false, error: "删除教育经历失败" }, { status: 500 });
  }
}
