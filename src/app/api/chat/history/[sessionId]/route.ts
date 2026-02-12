import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatMessages } from "@/db/schema/chat";
import { eq } from "drizzle-orm";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const resolvedParams = await params;
        const { sessionId } = resolvedParams;

        await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));

        return NextResponse.json({ success: true }); // Return JSON as expected? Backend returned 204.
        // Frontend expects 200 or 204.
    } catch (error) {
        console.error("Error deleting chat history:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
