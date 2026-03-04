import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/db";
import { user } from "@/db/schema/auth/user";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        // 获取用户信息
        const [foundUser] = await db
            .select()
            .from(user)
            .where(eq(user.id, userId));

        if (!foundUser) {
            return NextResponse.json({ isAdmin: false });
        }

        // 检查角色是否为 admin
        return NextResponse.json({ isAdmin: foundUser.role === "admin" });
    } catch (error) {
        console.error("Check admin error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
