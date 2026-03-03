import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/get-session";
import { db } from "@/db";
import { ssoToken } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// GET /api/admin/sso-token - 生成SSO token
export async function GET() {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    // 检查是否是管理员
    if ((session.user as any).role !== "admin") {
      return NextResponse.json(
        { success: false, error: "无权限访问" },
        { status: 403 }
      );
    }

    // 生成临时 token，5分钟内有效
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟

    // 存储 token 到数据库
    await db.insert(ssoToken).values({
      id: nanoid(),
      token,
      userId: session.user.id,
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      token,
      expiresIn: 300, // 秒
    });
  } catch (error) {
    console.error("生成SSO token失败:", error);
    return NextResponse.json(
      { success: false, error: "生成token失败" },
      { status: 500 }
    );
  }
}
