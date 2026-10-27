import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { interactiveComment, interactiveCommentLike } from "@/db/schema/game";
import { ensureGameTablesOnce, resolveVoterKey } from "@/lib/games";
import { getServerSession } from "@/lib/auth/get-session";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

/** 评论点赞切换：同一 voterKey 对同一评论仅一条点赞记录，再次调用即取消 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  try {
    await ensureGameTablesOnce();

    const { id, commentId } = await params;
    const body = await request.json().catch(() => ({}));
    const session = await getServerSession();
    const { voterKey } = resolveVoterKey(session?.user?.id, body.voterKey);

    const [comment] = await db
      .select()
      .from(interactiveComment)
      .where(and(eq(interactiveComment.id, commentId), eq(interactiveComment.workId, id)))
      .limit(1);
    if (!comment) {
      return NextResponse.json({ success: false, error: "评论不存在" }, { status: 404 });
    }

    const [existing] = await db
      .select()
      .from(interactiveCommentLike)
      .where(
        and(eq(interactiveCommentLike.commentId, commentId), eq(interactiveCommentLike.voterKey, voterKey)),
      )
      .limit(1);

    let liked: boolean;
    if (existing) {
      await db.delete(interactiveCommentLike).where(eq(interactiveCommentLike.id, existing.id));
      liked = false;
    } else {
      await db
        .insert(interactiveCommentLike)
        .values({ id: nanoid(), commentId, voterKey });
      liked = true;
    }

    const [updated] = await db
      .update(interactiveComment)
      .set({
        likeCount: sql`GREATEST(${interactiveComment.likeCount} + ${liked ? 1 : -1}, 0)`,
      })
      .where(eq(interactiveComment.id, commentId))
      .returning({ likeCount: interactiveComment.likeCount });

    return NextResponse.json({ success: true, data: { liked, likeCount: updated.likeCount } });
  } catch (error) {
    console.error("切换评论点赞失败:", error);
    return NextResponse.json({ success: false, error: "操作失败，请稍后重试" }, { status: 500 });
  }
}
