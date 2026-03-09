import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { db } from "@/db";
import { chatMessages } from "@/db/schema/chat";
import { blog } from "@/db/schema/blog";
import { getSystemPrompt } from "@/lib/knowledge";
import { desc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const DISABLE_CHAT_DB = process.env.CHAT_DISABLE_DB === "1";

const PROMPT_LEAK_PATTERNS = [
    /输出.*知识库/i,
    /导出.*知识库/i,
    /把.*知识库.*给我/i,
    /系统提示/i,
    /system\s*prompt/i,
    /prompt注入/i,
    /提示词/i,
    /完整.*内容/i,
    /全文/i,
    /原文/i,
    /全部.*内容/i,
];

const isPromptLeakAttempt = (text: string) => {
    const normalized = text.replace(/\s+/g, "").toLowerCase();
    return PROMPT_LEAK_PATTERNS.some((pattern) => pattern.test(text) || pattern.test(normalized));
};

const PROMPT_LEAK_REFUSAL = "抱歉，我不能提供知识库原文、完整内容或系统提示词。你可以告诉我想了解的具体方向，我可以基于知识库给你简要总结。";

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
    const zhChars = normalized.match(/[\u4e00-\u9fa5]/g) || [];
    const words = normalized.split(/[^\u4e00-\u9fa5a-z0-9]+/).filter((item) => item.length >= 2);
    return Array.from(new Set([...words, ...zhChars]));
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

        const ranked = posts
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

        return ranked;
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
        sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";

        if (!message || typeof message !== "string" || !message.trim()) {
            return NextResponse.json({
                success: false,
                error: "消息内容不能为空",
                sessionId,
            }, { status: 400 });
        }

        if (isPromptLeakAttempt(message)) {
            return NextResponse.json({
                success: true,
                message: PROMPT_LEAK_REFUSAL,
                sessionId,
            });
        }

        if (!sessionId) {
            sessionId = uuidv4();
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: "AI 服务暂未配置，请稍后重试。",
                sessionId,
            }, { status: 503 });
        }

        let historyMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
        let canPersist = !DISABLE_CHAT_DB;

        if (canPersist) {
            try {
                await db.insert(chatMessages).values({
                    sessionId,
                    role: 'user',
                    content: message,
                });

                const historyData = await db.query.chatMessages.findMany({
                    where: eq(chatMessages.sessionId, sessionId),
                    orderBy: [desc(chatMessages.createdAt)],
                    limit: 20,
                });

                historyMessages = historyData.reverse().map(msg => ({
                    role: msg.role as "user" | "assistant",
                    content: msg.content,
                }));
            } catch (dbError) {
                canPersist = false;
                console.error("Chat DB unavailable, fallback to stateless mode:", dbError);
            }
        }

        const systemPrompt = getSystemPrompt();
        const ragSources = await retrieveBlogSources(message);
        const ragContext = ragSources.length
            ? `\n\n=== 站内文章参考片段（仅内部参考，不要完整复述）===\n${ragSources
                .map((source, index) => `${index + 1}. ${source.title} (${source.url})\n片段: ${source.snippet}`)
                .join("\n\n")}\n=== 参考片段结束 ===\n\n请优先结合上述参考片段回答；可给出简要依据，但不要输出完整片段。`
            : "";
        const finalSystemPrompt = `${systemPrompt}${ragContext}`;

        // Construct messages array for OpenAI
        const messages: ChatCompletionMessageParam[] = [
            { role: "system", content: finalSystemPrompt },
            ...historyMessages,
            // Replicating original behavior: add current message again explicitly at the end
            { role: "user", content: message }
        ];

        // 3. Call AI
        const openai = new OpenAI({
            baseURL: process.env.OPENAI_BASE_URL,
            apiKey,
        });

        const primaryModel = (process.env.OPENAI_MODEL || "gemini-2.5-flash-cli").trim();
        const fallbackModels = (process.env.OPENAI_MODEL_FALLBACKS || "gemini-2.5-pro-cli,gemini-2.5-flash-cli")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        const modelCandidates = Array.from(new Set([primaryModel, ...fallbackModels]));

        let completion: Awaited<ReturnType<typeof openai.chat.completions.create>> | null = null;
        let lastModelError: Error | null = null;

        for (const model of modelCandidates) {
            try {
                completion = await openai.chat.completions.create({
                    model,
                    messages,
                    temperature: 0.7,
                    max_tokens: 2048,
                });
                break;
            } catch (modelError: unknown) {
                const status =
                    typeof modelError === "object" && modelError !== null && "status" in modelError
                        ? Number((modelError as { status?: number }).status)
                        : undefined;
                const code =
                    typeof modelError === "object" && modelError !== null && "code" in modelError
                        ? String((modelError as { code?: string }).code)
                        : undefined;

                lastModelError = modelError instanceof Error ? modelError : new Error("Model invocation failed");
                const canRetry = status === 503 || code === "model_not_found";
                if (!canRetry) {
                    throw modelError;
                }
            }
        }

        if (!completion) {
            throw lastModelError || new Error("No available model channel");
        }

        const responseContent = completion.choices[0].message.content || "";

        if (canPersist) {
            try {
                await db.insert(chatMessages).values({
                    sessionId,
                    role: 'assistant',
                    content: responseContent,
                });
            } catch (dbError) {
                console.error("Chat response persistence failed:", dbError);
            }
        }

        return NextResponse.json({
            success: true,
            message: responseContent,
            sessionId: sessionId,
            meta: {
                sources: ragSources.map((source) => ({
                    title: source.title,
                    url: source.url,
                })),
            },
        });

    } catch (error: unknown) {
        console.error("Chat Error:", error);
        return NextResponse.json({
            success: false,
            error: "抱歉，我暂时无法回答您的问题，请稍后再试。",
            sessionId,
        }, { status: 500 });
    }
}
