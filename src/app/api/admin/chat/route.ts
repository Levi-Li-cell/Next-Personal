import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages } from "@/db/schema/chat";

interface RawMessage {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  createdAt: Date;
}

interface ConversationTurn {
  id: string;
  sessionId: string;
  /** 提问时间：取用户消息的时间 */
  questionTime: string;
  /** 对话 JSON：[{role, content, createdAt}]，user 在前 assistant 在后 */
  messages: Array<{ role: string; content: string; createdAt: string }>;
  /** 缩略预览文本 */
  preview: string;
  /** 涉及的消息条数 */
  messageCount: number;
}

/**
 * 将同一 sessionId 下、按时间排序的消息流配对为对话轮次。
 * 规则：以 user 消息为轮次起点，紧随其后的 assistant 消息归入同一轮次；
 * 若出现连续 user，则各自独立成轮次（assistant 缺失）；
 * 若 assistant 出现在最前（历史残留），单独成轮次。
 */
function buildConversationTurns(messages: RawMessage[]): ConversationTurn[] {
  const turns: ConversationTurn[] = [];
  let i = 0;
  while (i < messages.length) {
    const current = messages[i];
    const group: RawMessage[] = [current];
    if (current.role === "user") {
      // 吞掉后续连续的 assistant（通常 1 条）
      while (
        i + 1 < messages.length &&
        messages[i + 1].role === "assistant"
      ) {
        i += 1;
        group.push(messages[i]);
      }
    }
    i += 1;

    const questionTime = group[0].createdAt.toISOString();
    const msgJson = group.map((m) => ({
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));

    const userMsg = group.find((m) => m.role === "user");
    const aiMsg = group.find((m) => m.role === "assistant");
    const previewUser = userMsg
      ? `用户：${truncate(userMsg.content, 40)}`
      : "";
    const previewAi = aiMsg ? `AI：${truncate(aiMsg.content, 40)}` : "";
    const preview = [previewUser, previewAi].filter(Boolean).join(" / ") || "（空对话）";

    turns.push({
      id: group[0].id,
      sessionId: group[0].sessionId,
      questionTime,
      messages: msgJson,
      preview,
      messageCount: group.length,
    });
  }
  return turns;
}

function truncate(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max)}…` : normalized;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100);
    const role = String(searchParams.get("role") || "all").trim();
    const search = String(searchParams.get("search") || "").trim();

    // 1) 先按条件查出匹配的消息 id（用于分页 + 过滤）
    const matchConditions = [];
    if (role !== "all") {
      matchConditions.push(eq(chatMessages.role, role));
    }
    if (search) {
      matchConditions.push(
        or(
          ilike(chatMessages.content, `%${search}%`),
          ilike(chatMessages.sessionId, `%${search}%`)
        )
      );
    }
    const whereClause = matchConditions.length > 0 ? and(...matchConditions) : undefined;

    // 2) 找出命中的 sessionId 集合（分页基于会话维度）
    const matchedSessions = await db
      .select({ sessionId: chatMessages.sessionId })
      .from(chatMessages)
      .where(whereClause)
      .groupBy(chatMessages.sessionId)
      .orderBy(desc(sql`max(${chatMessages.createdAt})`));

    const total = matchedSessions.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const pageSessions = matchedSessions.slice(offset, offset + limit);

    // 3) 拉取这些会话下的全部消息，按时间正序
    let turns: ConversationTurn[] = [];
    if (pageSessions.length > 0) {
      const sessionIds = pageSessions.map((s) => s.sessionId);
      const allMessages = await db
        .select()
        .from(chatMessages)
        .where(inArray(chatMessages.sessionId, sessionIds))
        .orderBy(asc(chatMessages.sessionId), asc(chatMessages.createdAt));

      // 按会话分组
      const bySession = new Map<string, RawMessage[]>();
      for (const m of allMessages) {
        const arr = bySession.get(m.sessionId) || [];
        arr.push(m as unknown as RawMessage);
        bySession.set(m.sessionId, arr);
      }

      // 保持会话维度的排序（按最近消息时间倒序）
      const sessionOrder = pageSessions.map((s) => s.sessionId);
      turns = sessionOrder.flatMap((sid) => buildConversationTurns(bySession.get(sid) || []));
    }

    return NextResponse.json({
      success: true,
      data: turns,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("获取聊天记录失败:", error);
    return NextResponse.json({ success: false, error: "获取聊天记录失败" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = String(searchParams.get("sessionId") || "").trim();

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "缺少会话ID" }, { status: 400 });
    }

    await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除聊天会话失败:", error);
    return NextResponse.json({ success: false, error: "删除聊天会话失败" }, { status: 500 });
  }
}
