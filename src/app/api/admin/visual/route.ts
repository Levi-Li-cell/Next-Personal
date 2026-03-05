import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

type DailyPoint = { day: string; users: number; comments: number; guestbook: number };

async function ensureVisualTables() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS admin_notification (
      id text PRIMARY KEY,
      user_name text NOT NULL,
      user_email text NOT NULL,
      event_type text NOT NULL DEFAULT 'user_signup',
      read boolean NOT NULL DEFAULT false,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    )
  `);
}

export async function GET() {
  try {
    await ensureVisualTables();

    const [summaryResult, eventDistResult, trendResult, recentResult] = await Promise.all([
      db.execute(sql`
        SELECT
          (SELECT COUNT(*)::int FROM "user") AS users,
          (SELECT COUNT(*)::int FROM blog) AS blogs,
          (SELECT COUNT(*)::int FROM project) AS projects,
          (SELECT COUNT(*)::int FROM blog_comment) AS comments,
          (SELECT COUNT(*)::int FROM guestbook_message) AS guestbook,
          (SELECT COUNT(*)::int FROM admin_notification WHERE read = false) AS unread
      `),
      db.execute(sql`
        SELECT event_type, COUNT(*)::int AS count
        FROM admin_notification
        GROUP BY event_type
      `),
      db.execute(sql`
        WITH day_series AS (
          SELECT generate_series(
            date_trunc('day', now()) - interval '6 day',
            date_trunc('day', now()),
            interval '1 day'
          ) AS day
        )
        SELECT
          to_char(ds.day, 'MM-DD') AS day,
          COALESCE((SELECT COUNT(*)::int FROM "user" u WHERE date_trunc('day', u."createdAt") = ds.day), 0) AS users,
          COALESCE((SELECT COUNT(*)::int FROM blog_comment bc WHERE date_trunc('day', bc.created_at) = ds.day), 0) AS comments,
          COALESCE((SELECT COUNT(*)::int FROM guestbook_message gm WHERE date_trunc('day', gm.created_at) = ds.day), 0) AS guestbook
        FROM day_series ds
        ORDER BY ds.day
      `),
      db.execute(sql`
        SELECT id, user_name, user_email, event_type, read, created_at
        FROM admin_notification
        ORDER BY created_at DESC
        LIMIT 60
      `),
    ]);

    const summary = (summaryResult as unknown as {
      rows?: Array<{
        users: number;
        blogs: number;
        projects: number;
        comments: number;
        guestbook: number;
        unread: number;
      }>;
    }).rows?.[0] || {
      users: 0,
      blogs: 0,
      projects: 0,
      comments: 0,
      guestbook: 0,
      unread: 0,
    };

    const eventDistRows = (eventDistResult as unknown as {
      rows?: Array<{ event_type: string; count: number }>;
    }).rows || [];

    const trendRows = (trendResult as unknown as {
      rows?: DailyPoint[];
    }).rows || [];

    const recentNotifications = (recentResult as unknown as {
      rows?: Array<{
        id: string;
        user_name: string;
        user_email: string;
        event_type: string;
        read: boolean;
        created_at: string;
      }>;
    }).rows || [];

    return NextResponse.json({
      success: true,
      data: {
        summary,
        eventDistribution: eventDistRows,
        weeklyTrend: trendRows,
        recentNotifications,
      },
    });
  } catch (error) {
    console.error("获取可视化数据失败:", error);
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          users: 0,
          blogs: 0,
          projects: 0,
          comments: 0,
          guestbook: 0,
          unread: 0,
        },
        eventDistribution: [],
        weeklyTrend: [],
        recentNotifications: [],
      },
      degraded: true,
    });
  }
}
