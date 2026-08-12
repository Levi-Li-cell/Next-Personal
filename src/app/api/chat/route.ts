import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/db";
import { chatMessages } from "@/db/schema/chat";
import { blog } from "@/db/schema/blog";
import {
  authorEducation,
  authorExperience,
  authorProfile,
  authorSkill,
} from "@/db/schema/author";
import { getSystemPrompt } from "@/lib/knowledge";
import { asc, desc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

const DISABLE_CHAT_DB = process.env.CHAT_DISABLE_DB === "1" || process.env.CHAT_DISABLE_DB === "true";

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
  "抱歉，此问题我不能回复。你可以问具体方向（经历、技能、项目等），我可以基于公开资料简要说明。";

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

function modelCandidates(): string[] {
  const primaryModel = (process.env.OPENAI_MODEL || "deepseek-v4-flash").trim();
  const fallbackModels = (process.env.OPENAI_MODEL_FALLBACKS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set([primaryModel, ...fallbackModels].filter(Boolean)));
}

function firstSentence(value?: string | null): string {
  return (value || "").split(/[。；;\n]/)[0]?.trim() || "";
}

async function buildAuthorFallback(question: string): Promise<string> {
  try {
    const [profiles, experiences, education, skills] = await Promise.all([
      db.select().from(authorProfile).orderBy(desc(authorProfile.createdAt)).limit(1),
      db.select().from(authorExperience).orderBy(asc(authorExperience.sortOrder)),
      db.select().from(authorEducation).orderBy(asc(authorEducation.sortOrder)).limit(1),
      db.select().from(authorSkill).orderBy(asc(authorSkill.sortOrder)).limit(30),
    ]);

    const profile = profiles[0];
    const school = education[0];
    const name = profile?.name || "李伟";
    const title = profile?.title || profile?.preferredPosition || "全栈工程师";
    const normalized = question.replace(/\s+/g, "").toLowerCase();
    const featuredJobs = experiences.filter((job) =>
      job.company.includes("幻云") || job.company.includes("零度象限"),
    );
    const jobs = (featuredJobs.length ? featuredJobs : experiences).slice(0, 3);

    if (/后端|服务端|接口|数据库|spring|java|node|独立完成|独立开发/.test(normalized)) {
      const backendSkills = skills
        .map((skill) => skill.name)
        .filter((name) => /Java(?!Script)|Spring|Node\.js|Next\.js API|PostgreSQL|Flyway|MySQL|Redis|RESTful|Swagger|Apifox/i.test(name))
        .slice(0, 5);
      const evidence = backendSkills.length
        ? backendSkills.join("、")
        : "Next.js API Routes、Node.js、PostgreSQL 与接口联调";
      if (/能否|是否|可不可以|独立|胜任/.test(normalized)) {
        return `可以。${name}能够独立完成中小型项目或 MVP 的接口设计、数据建模、认证权限、核心业务、联调与部署；实际使用过${evidence}。对于复杂高并发或大型分布式系统，他也能在团队协作下快速推进。`;
      }
      return `${name}具备独立交付中小型项目后端的能力，覆盖接口设计、数据库建模、认证权限、业务实现、联调和部署。相关技术包括${evidence}，并已在个人博客、题力榜等真实项目中落地。`;
    }

    if (/项目|作品|做过|经验/.test(normalized)) {
      const projects = jobs
        .map((job) => {
          const project = firstSentence(job.description);
          const duty = firstSentence(job.achievements?.[0]);
          return `${job.company}：${project}${duty ? `；${duty}` : ""}`;
        })
        .filter(Boolean)
        .slice(0, 3);
      return projects.length
        ? `${name}的代表项目包括：\n${projects.map((item) => `- ${item}`).join("\n")}`
        : `${name}的项目资料正在补充，可先了解他的技术能力与工作经历。`;
    }

    if (/教育|学校|学历|专业|毕业/.test(normalized) && school) {
      return `${name}本科就读于${school.school}，专业为${school.major}，时间为${school.startDate} - ${school.endDate}。`;
    }

    if (/技能|技术|技术栈|擅长|能力/.test(normalized)) {
      const names = skills.map((skill) => skill.name).filter(Boolean).slice(0, 6);
      return `${name}的核心能力包括${names.join("、")}，具备前后端协作、多端开发和项目落地经验。`;
    }

    if (/兴趣|爱好/.test(normalized)) {
      const hobbies = Array.isArray(profile?.hobbies) ? profile.hobbies.filter(Boolean) : [];
      return hobbies.length
        ? `${name}的兴趣包括${hobbies.slice(0, 7).join("、")}。`
        : `${name}注重持续学习，也关注设计与运动。`;
    }

    if (/为什么|适合|优势|录用|岗位|面试/.test(normalized)) {
      const companyNames = Array.from(new Set(jobs.map((job) => job.company))).slice(0, 2);
      const skillNames = skills.map((skill) => skill.name).filter(Boolean).slice(0, 3);
      return `${name}适合全栈开发岗位：有${companyNames.join("、")}的实际项目经历，掌握${skillNames.join("、")}，能够独立推进需求落地并配合团队交付。`;
    }

    const experienceSummary = Array.from(new Set(jobs.map((job) => job.company))).slice(0, 2).join("、");
    return `${name}是一名${title}，${school ? `本科就读于${school.school}` : "具备本科背景"}，曾在${experienceSummary || "互联网项目团队"}参与真实项目开发，方向覆盖前端、多端应用与后端协作。`;
  } catch (error) {
    console.error("Author fallback failed:", error);
    return "AI 服务当前繁忙。您可以继续查看首页中的教育、工作经历、兴趣和专业技能。";
  }
}

export async function POST(req: NextRequest) {
  let sessionId = "";
  try {
    const body = await req.json();
    const { message } = body;
    sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : "";

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "消息内容不能为空",
          sessionId,
        },
        { status: 400 },
      );
    }

    const trimmedMessage = message.trim().slice(0, 4000);

    if (!sessionId) {
      sessionId = uuidv4();
    }

    const rate = checkRateLimit(getClientKey(req, sessionId));
    if (!rate.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `请求过于频繁，请 ${rate.retryAfterSec} 秒后再试。`,
          sessionId,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSec) },
        },
      );
    }

    if (isPromptLeakAttempt(trimmedMessage)) {
      return NextResponse.json({
        success: true,
        message: PROMPT_LEAK_REFUSAL,
        sessionId,
      });
    }

    const apiKey = (process.env.OPENAI_API_KEY || "").trim();
    const baseURL = (process.env.OPENAI_BASE_URL || "https://api.deepseek.com").trim().replace(/\/+$/, "");
    if (!apiKey) {
      return new Response(await buildAuthorFallback(trimmedMessage), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Session-Id": sessionId,
          "X-Chat-Degraded": "1",
          "Cache-Control": "no-cache, no-transform",
        },
      });
    }

    const client = new OpenAI({ apiKey, baseURL });

    let historyMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
    let canPersist = !DISABLE_CHAT_DB;

    if (canPersist) {
      try {
        const historyData = await db.query.chatMessages.findMany({
          where: eq(chatMessages.sessionId, sessionId),
          orderBy: [desc(chatMessages.createdAt)],
          limit: 20,
        });

        historyMessages = historyData
          .reverse()
          .map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }))
          .filter((msg) => msg.content?.trim());

        await db.insert(chatMessages).values({
          sessionId,
          role: "user",
          content: trimmedMessage,
        });
      } catch (dbError) {
        canPersist = false;
        console.error("Chat DB unavailable, fallback to stateless mode:", dbError);
      }
    }

    const systemPrompt = await getSystemPrompt();
    const ragSources = await retrieveBlogSources(trimmedMessage);
    const ragContext = ragSources.length
      ? `\n\n=== 站内文章参考片段（仅内部参考，不要完整复述）===\n${ragSources
          .map((source, index) => `${index + 1}. ${source.title} (${source.url})\n片段: ${source.snippet}`)
          .join("\n\n")}\n=== 参考片段结束 ===\n\n请优先结合上述参考片段回答；可给出简要依据，但不要输出完整片段。`
      : "";
    const finalSystemPrompt = `${systemPrompt}${ragContext}`;

    const candidates = modelCandidates();
    const modelName = candidates[0];
    const persistSessionId = sessionId;

    const apiMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: finalSystemPrompt },
      ...historyMessages,
      { role: "user", content: trimmedMessage },
    ];

    const encoder = new TextEncoder();
    let fullText = "";

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          // DeepSeek extension: thinking param disables thinking mode so content is returned directly
          const completion = await client.chat.completions.create({
            model: modelName,
            messages: apiMessages,
            temperature: 0.3,
            max_tokens: 1024,
            stream: true,
            thinking: { type: "disabled" },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any) as unknown as AsyncIterable<{ choices?: Array<{ delta?: { content?: string | null } }> }>;

          for await (const chunk of completion) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              controller.enqueue(encoder.encode(delta));
            }
          }

          controller.close();

          if (canPersist && fullText.trim()) {
            try {
              await db.insert(chatMessages).values({
                sessionId: persistSessionId,
                role: "assistant",
                content: fullText,
              });
            } catch (dbError) {
              console.error("Chat response persistence failed:", dbError);
            }
          }
        } catch (streamError) {
          console.error("Stream error:", streamError);
          const fallbackText = await buildAuthorFallback(trimmedMessage);
          controller.enqueue(encoder.encode(fallbackText));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Session-Id": sessionId,
        "X-Chat-Model": modelName,
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error: unknown) {
    console.error("Chat Error:", error);
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? Number((error as { status?: number }).status)
        : undefined;
    const message =
      status === 401
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
      { status: status && status >= 400 && status < 600 ? status : 500 },
    );
  }
}
