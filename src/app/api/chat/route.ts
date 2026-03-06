import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { db } from "@/db";
import { chatMessages } from "@/db/schema/chat";
import { getSystemPrompt } from "@/lib/knowledge";
import { desc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';

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

        // Construct messages array for OpenAI
        const messages = [
            { role: "system", content: systemPrompt },
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
        let lastModelError: any = null;

        for (const model of modelCandidates) {
            try {
                completion = await openai.chat.completions.create({
                    model,
                    messages: messages as any,
                    temperature: 0.7,
                    max_tokens: 2048,
                });
                break;
            } catch (modelError: any) {
                lastModelError = modelError;
                const canRetry = modelError?.status === 503 || modelError?.code === "model_not_found";
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
            sessionId: sessionId
        });

    } catch (error: any) {
        console.error("Chat Error:", error);
        return NextResponse.json({
            success: false,
            error: "抱歉，我暂时无法回答您的问题，请稍后再试。",
            sessionId,
        }, { status: 500 });
    }
}
