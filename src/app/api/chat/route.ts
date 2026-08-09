import { NextRequest, NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, toDataStreamResponse } from "ai";
import { db } from "@/db";
import { chatMessages } from "@/db/schema/chat";
import { desc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getSystemPrompt } from "@/lib/knowledge";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getClientKey(req: NextRequest, sessionId: string): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  const ip = forwarded || realIp || "unknown";
  return `${ip}:${sessionId || "nosession"}`;
}

function checkRateLimit(key: string): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const current = rateLimitMap.get(key);
  if (!current || now >= current.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true, retryAfterSec: 0 };
  }
  if (current.count >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;
  rateLimitMap.set(key, current);
  return { ok: true, retryAfterSec: 0 };
}

const PROMPT_LEAK_PATTERNS = [
  /系统提示词/i,
  /system\s*prompt/i,
  /prompt\s*injection/i,
  /提示词注入/i,
  /导出\s*(系统)?\s*(提示|prompt)/i,
  /输出\s*(系统)?\s*(提示|prompt|指令)/i,
  /忽略(以上|之前|所有).*(指令|规则|提示)/i,
  /ignore\s+(all|previous|above)\s+(instructions|prompts)/i,
  /把.*知识库.*(原文|完整|全部).*(导出|发给|给我)/i,
  /dump\s*(the\s*)?(system|prompt|knowledge)/i,
];

const isPromptLeakAttempt = (text: string) => {
  const normalized = text.replace(/\s+/g, "").toLowerCase();
  return PROMPT_LEAK_PATTERNS.some((pattern) => pattern.test(text) || pattern.test(normalized));
};

const PROMPT_LEAK_REFUSAL =
  "抱歉，我不能提供系统提示词或知识库原文导出。你可以问具体方向（经历、技能、项目等），我可以基于公开资料简要说明。";

type BlogCandidate = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  tags: string[] | null;
  category: string;
};

type RagSource = {
  title: string;
  slug: string;
  url: string;
  score: number;
  snippet: string;
};

function normalizeText(input: string): string {
  return input
    .replace(/[`#>*_~\-\[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function tokenize(input: string): string[] {
  const normalized = normalizeText(input);
  const zhBigrams: string[] = [];
  const zhChars = normalized.match(/[\u4e00-\u9fa5]+/g) || [];
  for (const run of zhChars) {
    if (run.length === 1) zhBigrams.push(run);
    for (let i = 0; i < run.length - 1; i++) {
      zhBigrams.push(run.slice(i, i + 2));
    }
  }
  const words = normalized.split(/[^\u4e00-\u9fa5a-z0-9]+/).filter((item) => item.length >= 2);
  return Array.from(new Set([...words, ...zhBigrams]));
}

function buildSnippet(text: string, queryTokens: string[]): string {
  const plain = normalizeText(text).slice(0, 1200);
  if (!plain) return "";
  const hit = queryTokens.find((token) => plain.includes(token));
  if (!hit) {
    return plain.slice(0, 180);
  }
  const index = plain.indexOf(hit);
  const start = Math.max(0, index - 70);
  const end = Math.min(plain.length, index + 110);
  return plain.slice(start, end);
}

function scoreBlog(queryTokens: string[], candidate: BlogCandidate): number {
  const title = normalizeText(candidate.title);
  const excerpt = normalizeText(candidate.excerpt || "");
  const content = normalizeText(candidate.content || "");
  const tags = normalizeText((candidate.tags || []).join(" "));
  let score = 0;

  for (const token of queryTokens) {
    if (title.includes(token)) score += 4;
    if (tags.includes(token)) score += 3;
    if (excerpt.includes(token)) score += 2;
    if (content.includes(token)) score += 1;
  }

  return score;
}

async function retrieveBlogSources(question: string): Promise<RagSource[]> {
  const tokens = tokenize(question);
  if (!tokens.length) return [];

  try {
    const posts = await db
      .select({
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        content: blog.content,
        tags: blog.tags,
        category: blog.category,
      })
      .from(blog)
      .where(eq(blog.status, "published"))
      .orderBy(desc(blog.createdAt))
      .limit(80);

    return posts
      .map((post) => ({
        ...post,
        score: scoreBlog(tokens, {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          tags: (post.tags as string[] | null) || [],
          category: post.category,
        }),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => ({
        title: item.title,
        slug: item.slug,
        url: `/blog/${item.slug}`,
        score: item.score,
        snippet: buildSnippet(`${item.excerpt || ""} ${item.content || ""}`, tokens),
      }));
  } catch (error) {
    console.error("RAG source retrieval failed:", error);
    return [];
  }
}

export async function POST(req: NextRequest) {
  let sessionId = "";
  try {
    const body = await req.json();
    const { message } = body;
    sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : uuidv4();

    const trimmed = message?.trim().slice(0, 4000);
    if (!trimmed) {
      return NextResponse.json(
        { success: false, error: "消息内容不能为空", sessionId },
        { status: 400 }
      );
    }

    const rate = checkRateLimit(getClientKey(req, sessionId));
    if (!rate.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `请求过于频繁，请 ${rate.retryAfterSec} 秒后再试。`,
          sessionId,
        },
        { status: 429 }
      );
    }

    if (isPromptLeakAttempt(trimmed)) {
      return NextResponse.json({
        success: true,
        message: PROMPT_LEAK_REFUSAL,
        sessionId,
      });
    }

    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });

    const historyData = await db.query.chatMessages.findMany({
      where: eq(chatMessages.sessionId, sessionId),
      orderBy: [desc(chatMessages.createdAt)],
      limit: 20,
    });
    const history = historyData
      .reverse()
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }))
      .filter((m) => m.content?.trim());

    const systemPrompt = getSystemPrompt();
    const ragSources = await retrieveBlogSources(trimmed);
    const ragContext = ragSources.length
      ? `\n\n=== 站内文章参考片段（仅内部参考，不要完整复述）===\n${ragSources
          .map((source, index) => `${index + 1}. ${source.title} (${source.url})\n片段: ${source.snippet}`)
          .join("\n\n")}\n=== 参考片段结束 ===\n\n请优先结合上述参考片段回答；可给出简要依据，但不要输出完整片段。`
      : "";
    const finalSystemPrompt = `${systemPrompt}${ragContext}`;

    const result = await streamText({
      model: openai("deepseek-v4-flash"),
      system: finalSystemPrompt,
      messages: [
        { role: "system", content: finalSystemPrompt },
        ...history,
        { role: "user", content: trimmed },
      ],
      maxTokens: 1024,
      temperature: 0.3,
    });

    return new Response(toDataStreamResponse(result));
  } catch (error) {
    console.error("Chat Error:", error);
    const status = typeof error === "object" && error !== null && "status" in error
      ? Number((error as { status?: number }).status)
      : undefined;
    const message = status === 401
      ? "AI 密钥无效或未授权，请检查配置。"
      : status === 429
        ? "AI 服务繁忙或额度不足，请稍后再试。"
        : "抱歉，我暂时无法回答您的问题，请稍后再试。";

    return NextResponse.json(
      {
        success: false,
        error: message,
        sessionId,
      },
      { status: status && status >= 400 && status < 600 ? status : 500 }
    );
  }
}
