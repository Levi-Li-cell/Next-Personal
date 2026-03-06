import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { guardRegistration } from "@/lib/auth/register-guard";
import { db } from "@/db";
import { user } from "@/db/schema/auth/user";
import { ensureUserRegisterColumns } from "@/lib/auth/register-guard";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body?.email || "").trim();
    const result = await guardRegistration(request, email, { persistAttempt: false });

    if (result.blocked) {
      return NextResponse.json(
        {
          success: false,
          blocked: true,
          reason: result.reason,
          message: "注册请求过于频繁，请稍后再试。",
        },
        { status: 429 }
      );
    }

    return NextResponse.json({ success: true, blocked: false, ip: result.ip });
  } catch (error) {
    console.error("注册防护检查失败:", error);
    return NextResponse.json({ success: false, error: "注册防护检查失败" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body?.email || "").trim();

    if (!email) {
      return NextResponse.json({ success: false, error: "缺少邮箱" }, { status: 400 });
    }

    const result = await guardRegistration(request, email, { persistAttempt: true });
    await ensureUserRegisterColumns();

    const [matchedUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .orderBy(desc(user.createdAt))
      .limit(1);

    if (matchedUser) {
      await db
        .update(user)
        .set({
          registerIp: result.ip,
          registerUserAgent: result.userAgent,
          registerRiskLevel: result.riskLevel,
        })
        .where(eq(user.id, matchedUser.id));
    }

    return NextResponse.json({ success: true, blocked: result.blocked, ip: result.ip, riskLevel: result.riskLevel });
  } catch (error) {
    console.error("注册信息落库失败:", error);
    return NextResponse.json({ success: false, error: "注册信息落库失败" }, { status: 500 });
  }
}
