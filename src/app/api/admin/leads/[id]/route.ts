import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lead } from "@/db/schema/lead";

const allowedStatuses = new Set(["new", "contacted", "in_progress", "closed"]);

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const nextStatus = String(body.status || "");
    const notes = typeof body.notes === "string" ? body.notes : undefined;

    if (nextStatus && !allowedStatuses.has(nextStatus)) {
      return NextResponse.json({ success: false, error: "非法状态" }, { status: 400 });
    }

    const [updated] = await db
      .update(lead)
      .set({
        status: nextStatus || undefined,
        notes,
      })
      .where(eq(lead.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: "线索不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update lead:", error);
    return NextResponse.json({ success: false, error: "更新线索失败" }, { status: 500 });
  }
}
