import { NextRequest, NextResponse } from "next/server";
import { sendTestEmailToAdmin } from "@/lib/admin/email";
import { getServerSession } from "@/lib/auth/get-session";
import { db } from "@/db";
import { user } from "@/db/schema/auth/user";
import { eq } from "drizzle-orm";

function isAdminRole(role: unknown) {
  return typeof role === "string" && role.trim().toLowerCase() === "admin";
}

async function assertAdmin(session: Awaited<ReturnType<typeof getServerSession>>) {
  if (isAdminRole((session?.user as { role?: unknown } | undefined)?.role)) {
    return true;
  }

  if (!session?.user?.id) return false;

  const [foundUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  return isAdminRole(foundUser?.role);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const isAdmin = await assertAdmin(session);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
    }

    const body = await request.json();
    const to = String(body.to || "").trim();
    const adminName = String(body.adminName || "").trim();

    if (!to) {
      return NextResponse.json({ success: false, error: "缺少测试邮箱地址" }, { status: 400 });
    }

    await sendTestEmailToAdmin({
      to,
      adminName,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("发送测试邮件失败:", error);

    const message = error instanceof Error ? error.message : "发送测试邮件失败";
    const status = message.includes("QQ SMTP 未配置") ? 400 : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
