import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

async function ensureSponsorPaymentsTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sponsor_payment (
      id text PRIMARY KEY,
      provider text NOT NULL DEFAULT 'stripe',
      stripe_session_id text,
      stripe_payment_intent_id text,
      user_id text,
      user_email text,
      amount integer NOT NULL,
      currency text NOT NULL,
      status text NOT NULL,
      metadata jsonb,
      created_at timestamp DEFAULT now() NOT NULL
    )
  `);
}

export async function GET(request: NextRequest) {
  try {
    await ensureSponsorPaymentsTable();

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100);
    const search = String(searchParams.get("search") || "").trim();
    const status = String(searchParams.get("status") || "all").trim();
    const offset = (page - 1) * limit;

    const whereSql = sql`
      WHERE 1 = 1
      ${status !== "all" ? sql`AND status = ${status}` : sql``}
      ${search ? sql`AND (COALESCE(user_email, '') ILIKE ${`%${search}%`} OR COALESCE(stripe_session_id, '') ILIKE ${`%${search}%`})` : sql``}
    `;

    const rowsResult = await db.execute(sql`
      SELECT
        id,
        provider,
        stripe_session_id AS "stripeSessionId",
        stripe_payment_intent_id AS "stripePaymentIntentId",
        user_id AS "userId",
        user_email AS "userEmail",
        amount,
        currency,
        status,
        created_at AS "createdAt"
      FROM sponsor_payment
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const countResult = await db.execute(sql`
      SELECT count(*)::int AS total
      FROM sponsor_payment
      ${whereSql}
    `);

    const rows = (rowsResult as unknown as { rows?: unknown[] }).rows || [];
    const total = Number((countResult as unknown as { rows?: Array<{ total: number }> }).rows?.[0]?.total || 0);

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取赞助记录失败:", error);
    return NextResponse.json({ success: false, error: "获取赞助记录失败" }, { status: 500 });
  }
}
