import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { interactiveComment, interactiveCommentLike, interactiveWork } from "@/db/schema/game";
import { ensureGameTables, resolveVoterKey } from "@/lib/games";
import { getServerSession } from "@/lib/auth/get-session";
import { createAdminNotification } from "@/lib/notifications/admin-notify";
import { nanoid } from "nanoid";
import type { CommentNode } from "@/lib/games-types";

export const dynamic = "force-dynamic";

type CommentRow = typeof interactiveComment.$inferSelect;

function toNode(row: CommentRow, likedIds: Set<string>, replies: CommentNode[] = []): CommentNode {
  return {
    id: row.id,
    workId: row.workId,
    content: row.content,
    userId: row.userId,
    displayName: row.guestName || "用户",
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    likeCount: row.likeCount,
    likedByMe: likedIds.has(row.id),
    replies,
  };
}

/** 评论列表：根评论倒序、回复正序的一层树；voter 用于回显点赞状态 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureGameTables();

    const { id } = await params;
    const [work] = await db.select().from(interactiveWork).where(eq(interactiveWork.id, id)).limit(1);
    if (!work) {
      return NextResponse.json({ success: false, error: "作品不存在" }, { status: 404 });
    }

    const session = await getServerSession();
    const voter = new URL(request.url).searchParams.get("voter") || "";
    const { voterKey } = resolveVoterKey(session?.user?.id, voter);

    const rootComments = await db
      .select()
      .from(interactiveComment)
      .where(
        and(
          eq(interactiveComment.workId, id),
          eq(interactiveComment.status, "approved"),
          isNull(interactiveComment.parentId),
        ),
      )
      .orderBy(desc(interactiveComment.createdAt));

    const rootIds = rootComments.map((row) => row.id);
    const replies = rootIds.length
      ? await db
          .select()
          .from(interactiveComment)
          .where(
            and(
              eq(interactiveComment.workId, id),
              eq(interactiveComment.status, "approved"),
              inArray(interactiveComment.parentId, rootIds),
            ),
          )
          .orderBy(asc(interactiveComment.createdAt))
      : [];

    const allIds = [...rootIds, ...replies.map((row) => row.id)];
    const likes = allIds.length
      ? await db
          .select({ commentId: interactiveCommentLike.commentId })
          .from(interactiveCommentLike)
          .where(
            and(
              eq(interactiveCommentLike.voterKey, voterKey),
              inArray(interactiveCommentLike.commentId, allIds),
            ),
          )
      : [];
    const likedIds = new Set(likes.map((row) => row.commentId));

    const list = rootComments.map((row) =>
      toNode(row, likedIds, replies.filter((reply) => reply.parentId === row.id).map((reply) => toNode(reply, likedIds))),
    );

    return NextResponse.json({
      success: true,
      data: {
        workId: id,
        total: rootComments.length + replies.length,
        list,
      },
    });
  } catch (error) {
    console.error("获取互动评论失败:", error);
    return NextResponse.json({ success: false, data: { workId: "", total: 0, list: [] }, degraded: true });
  }
}

/** 发表评论 / 回复：游客填 guestName，登录用户冗余 userId；成功后同步作品讨论数 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureGameTables();

    const { id } = await params;
    const session = await getServerSession();
    const body = await request.json().catch(() => ({}));
    const content = String(body.content || "").trim();
    const guestName = String(body.guestName || "").trim();
    const parentId = body.parentId ? String(body.parentId) : null;

    if (content.length < 1 || content.length > 2000) {
      return NextResponse.json({ success: false, error: "评论内容长度需在 1-2000 字之间" }, { status: 400 });
    }

    const [work] = await db.select().from(interactiveWork).where(eq(interactiveWork.id, id)).limit(1);
    if (!work || work.status !== "published") {
      return NextResponse.json({ success: false, error: "作品不存在" }, { status: 404 });
    }

    // 仅允许回复根评论，保持一层树结构
    if (parentId) {
      const [parent] = await db
        .select()
        .from(interactiveComment)
        .where(and(eq(interactiveComment.id, parentId), eq(interactiveComment.workId, id)))
        .limit(1);
      if (!parent || parent.parentId) {
        return NextResponse.json({ success: false, error: "回复目标不存在" }, { status: 400 });
      }
    }

    const displayName = session?.user?.name?.trim() || guestName || "匿名访客";

    const [comment] = await db
      .insert(interactiveComment)
      .values({
        id: nanoid(),
        workId: id,
        userId: session?.user?.id || null,
        guestName: session?.user?.id ? null : displayName,
        parentId,
        content,
      })
      .returning();

    const [updatedWork] = await db
      .update(interactiveWork)
      .set({ commentCount: sql`${interactiveWork.commentCount} + 1` })
      .where(eq(interactiveWork.id, id))
      .returning({ commentCount: interactiveWork.commentCount });

    try {
      await createAdminNotification({
        eventType: parentId ? "game_comment_reply" : "game_comment",
        title: parentId ? "互动作品收到新回复" : "互动作品收到新评论",
        content,
        link: `/games/${work.slug}`,
        userName: displayName,
        userEmail: session?.user?.email || "game-comment@anonymous.local",
      });
    } catch (notifyError) {
      console.error("发送互动评论通知失败:", notifyError);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          comment: toNode(comment, new Set()),
          commentCount: updatedWork.commentCount,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("发表互动评论失败:", error);
    return NextResponse.json({ success: false, error: "发表评论失败" }, { status: 500 });
  }
}
