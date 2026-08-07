import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { lead } from "@/db/schema/lead";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search");
    const type = searchParams.get("type") || "all";
    const status = searchParams.get("status") || "all";
    const offset = (page - 1) * limit;

    const conditions = [];
    if (type !== "all") conditions.push(eq(lead.type, type));
    if (status !== "all") conditions.push(eq(lead.status, status));
    if (search) {
      conditions.push(
        or(
          like(lead.name, `%${search}%`),
          like(lead.company, `%${search}%`),
          like(lead.email, `%${search}%`),
          like(lead.phone, `%${search}%`),
          like(lead.message, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const data = await db.select().from(lead).where(whereClause).orderBy(desc(lead.createdAt)).limit(limit).offset(offset);
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(lead).where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    return NextResponse.json({ success: false, error: "获取线索列表失败，请检查数据库迁移是否已执行" }, { status: 500 });
  }
}
