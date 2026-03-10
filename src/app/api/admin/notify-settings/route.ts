import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { ensureAdminNotifySettingTable } from "@/lib/admin/notify-settings";
import { getServerSession } from "@/lib/auth/get-session";
import { user } from "@/db/schema/auth/user";
import { eq } from "drizzle-orm";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const isAdmin = await assertAdmin(session);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
    }

    await ensureAdminNotifySettingTable();
    const smtpConfigured = Boolean(process.env.QQ_SMTP_USER && process.env.QQ_SMTP_PASS);

    const result = await db.execute(sql`
      SELECT
        u.id,
        u.name,
        u.email,
        COALESCE(s.notify_email, u.email) AS notify_email,
        COALESCE(s.enabled, true) AS enabled
      FROM "user" u
      LEFT JOIN admin_notify_setting s ON s.user_id = u.id
      WHERE u.id = ${session.user.id}
      LIMIT 1
    `);

    const rows = (result as unknown as {
      rows?: Array<{
        id: string;
        name: string;
        email: string;
        notify_email: string;
        enabled: boolean;
      }>;
    }).rows || [];

    if (rows.length === 0) {
      const settingResult = await db.execute(sql`
        SELECT notify_email, enabled
        FROM admin_notify_setting
        WHERE user_id = ${session.user.id}
        LIMIT 1
      `);

      const setting = (settingResult as unknown as {
        rows?: Array<{ notify_email: string; enabled: boolean }>;
      }).rows?.[0];

      return NextResponse.json({
        success: true,
        meta: { smtpConfigured },
        data: [
          {
            id: session.user.id,
            name: String((session.user as { name?: unknown }).name ?? "管理员"),
            email: String((session.user as { email?: unknown }).email ?? ""),
            notify_email: setting?.notify_email || String((session.user as { email?: unknown }).email ?? ""),
            enabled: setting?.enabled ?? true,
          },
        ],
      });
    }

    return NextResponse.json({ success: true, meta: { smtpConfigured }, data: rows });
  } catch (error) {
    console.error("获取通知配置失败:", error);
    return NextResponse.json({ success: false, error: "获取通知配置失败" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const isAdmin = await assertAdmin(session);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
    }

    await ensureAdminNotifySettingTable();
    const body = await request.json();
    const notifyEmail = String(body.notifyEmail || "").trim();
    const enabled = Boolean(body.enabled);

    if (!notifyEmail) {
      return NextResponse.json({ success: false, error: "通知邮箱不能为空" }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(notifyEmail)) {
      return NextResponse.json({ success: false, error: "通知邮箱格式不正确" }, { status: 400 });
    }

    await db.execute(sql`
      INSERT INTO admin_notify_setting (user_id, notify_email, enabled)
      VALUES (${session.user.id}, ${notifyEmail}, ${enabled})
      ON CONFLICT (user_id)
      DO UPDATE SET
        notify_email = EXCLUDED.notify_email,
        enabled = EXCLUDED.enabled,
        updated_at = now()
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("保存通知配置失败:", error);
    return NextResponse.json({ success: false, error: "保存通知配置失败" }, { status: 500 });
  }
}
