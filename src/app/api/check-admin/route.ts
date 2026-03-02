import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/db";
import { user } from "@/db/schema/auth/user";
import { eq } from "drizzle-orm";

// 管理员用户名
const ADMIN_USERNAME = "admin";

export async function POST(request: NextRequest) {
    try {
        const { userId, username } = await request.json();

        if (!userId || !username) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 检查用户名是否为 admin
        if (username !== ADMIN_USERNAME) {
            return NextResponse.json({ isAdmin: false });
        }

        // 获取用户信息
        const [foundUser] = await db
            .select()
            .from(user)
            .where(eq(user.id, userId));

        if (!foundUser) {
            return NextResponse.json({ isAdmin: false });
        }

        // 确保角色为 admin（数据库中已预设为 admin）
        return NextResponse.json({ isAdmin: foundUser.role === "admin" });
    } catch (error) {
        console.error("Check admin error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
