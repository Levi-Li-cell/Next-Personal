import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { db } from "@/db";
import { chatMessages } from "@/db/schema/chat";
import { getSystemPrompt } from "@/lib/knowledge";
import { desc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message } = body;
        let { sessionId } = body;

        if (!sessionId) {
            sessionId = uuidv4();
        }

        // 1. Save User Message
        await db.insert(chatMessages).values({
            sessionId,
            role: 'user',
            content: message,
        });

        // 2. Build History (fetch last 20 messages)
        const historyData = await db.query.chatMessages.findMany({
            where: eq(chatMessages.sessionId, sessionId),
            orderBy: [desc(chatMessages.createdAt)],
            limit: 20,
        });

        // Reverse to chronological order (oldest first) as required for LLM context
        const historyMessages = historyData.reverse().map(msg => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
        }));

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
            apiKey: process.env.OPENAI_API_KEY,
        });

        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gemini-2.5-pro-cli",
            messages: messages as any,
            temperature: 0.7,
            max_tokens: 2048,
        });

        const responseContent = completion.choices[0].message.content || "";

        // 4. Save Assistant Message
        await db.insert(chatMessages).values({
            sessionId,
            role: 'assistant',
            content: responseContent,
        });

        return NextResponse.json({
            success: true,
            message: responseContent,
            sessionId: sessionId
        });

    } catch (error: any) {
        console.error("Chat Error:", error);
        return NextResponse.json({
            success: false,
            error: "抱歉，我暂时无法回答您的问题，请稍后再试。错误: " + error.message,
            sessionId: req.body?.toString() // safe fallback?
        });
    }
}
