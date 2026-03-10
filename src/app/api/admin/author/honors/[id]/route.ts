import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { authorHonor } from "@/db/schema/author";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(authorHonor)
      .set({
        title: body.title,
        issuer: body.issuer,
        date: body.date,
        description: body.description,
        imageUrl: body.imageUrl,
        sortOrder: body.sortOrder || "0",
        updatedAt: new Date(),
      })
      .where(eq(authorHonor.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: "荣誉不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("更新荣誉失败:", error);
    return NextResponse.json({ success: false, error: "更新荣誉失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await db
      .delete(authorHonor)
      .where(eq(authorHonor.id, id))
      .returning({ id: authorHonor.id });

    if (!deleted[0]) {
      return NextResponse.json({ success: false, error: "荣誉不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除荣誉失败:", error);
    return NextResponse.json({ success: false, error: "删除荣誉失败" }, { status: 500 });
  }
}
