import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { authorExperience } from "@/db/schema/author";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(authorExperience)
      .set({
        company: body.company,
        position: body.position,
        startDate: body.startDate,
        endDate: body.endDate,
        description: body.description,
        achievements: body.achievements || [],
        techStack: body.techStack || [],
        sortOrder: body.sortOrder || "0",
        updatedAt: new Date(),
      })
      .where(eq(authorExperience.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: "工作经历不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("更新工作经历失败:", error);
    return NextResponse.json({ success: false, error: "更新工作经历失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await db
      .delete(authorExperience)
      .where(eq(authorExperience.id, id))
      .returning({ id: authorExperience.id });

    if (!deleted[0]) {
      return NextResponse.json({ success: false, error: "工作经历不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除工作经历失败:", error);
    return NextResponse.json({ success: false, error: "删除工作经历失败" }, { status: 500 });
  }
}
