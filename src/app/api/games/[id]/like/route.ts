import { NextRequest, NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { interactiveWork } from "@/db/schema/game";
import { ensureGameTablesOnce, resolveVoterKey, toggleWorkLike } from "@/lib/games";
import { getServerSession } from "@/lib/auth/get-session";

export const dynamic = "force-dynamic";

/** 喜欢/取消喜欢（幂等开关）：按 voterKey 去重，返回最新 likeCount 供前端直接联动 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureGameTablesOnce();

    const { id } = await params;
    const [work] = await db
      .select({ id: interactiveWork.id })
      .from(interactiveWork)
      .where(or(eq(interactiveWork.id, id), eq(interactiveWork.slug, id)))
      .limit(1);
    if (!work) {
      return NextResponse.json({ success: false, error: "作品不存在" }, { status: 404 });
    }

    const session = await getServerSession();
    const body = await request.json().catch(() => ({}));
    const { voterKey, userId } = resolveVoterKey(session?.user?.id, body.voterKey);

    const result = await toggleWorkLike(work.id, voterKey, userId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("切换喜欢状态失败:", error);
    return NextResponse.json({ success: false, error: "操作失败，请稍后重试" }, { status: 500 });
  }
}
