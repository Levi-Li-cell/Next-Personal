import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { authorSkill } from "@/db/schema/author";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(authorSkill)
      .set({
        name: body.name,
        level: body.level,
        category: body.category,
        sortOrder: body.sortOrder || "0",
        updatedAt: new Date(),
      })
      .where(eq(authorSkill.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: "技能不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("更新技能失败:", error);
    return NextResponse.json({ success: false, error: "更新技能失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await db
      .delete(authorSkill)
      .where(eq(authorSkill.id, id))
      .returning({ id: authorSkill.id });

    if (!deleted[0]) {
      return NextResponse.json({ success: false, error: "技能不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除技能失败:", error);
    return NextResponse.json({ success: false, error: "删除技能失败" }, { status: 500 });
  }
}
