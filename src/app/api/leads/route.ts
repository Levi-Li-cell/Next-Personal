import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lead } from "@/db/schema/lead";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const type = body.type === "hr" ? "hr" : "client";
    const payload = {
      id: randomUUID(),
      type,
      status: "new",
      name: String(body.name || "").trim(),
      company: String(body.company || "").trim() || null,
      email: String(body.email || "").trim() || null,
      phone: String(body.phone || "").trim() || null,
      jobTitle: type === "hr" ? String(body.jobTitle || "").trim() || null : null,
      projectType: type === "client" ? String(body.projectType || "").trim() || null : null,
      budgetRange: type === "client" ? String(body.budgetRange || "").trim() || null : null,
      timeline: String(body.timeline || "").trim() || null,
      sourcePage: String(body.sourcePage || "").trim() || null,
      message: String(body.message || "").trim(),
      notes: null,
    };

    if (!payload.name || !payload.message) {
      return NextResponse.json({ success: false, error: "缺少必填字段" }, { status: 400 });
    }

    const [created] = await db.insert(lead).values(payload).returning();
    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("Failed to create lead:", error);
    return NextResponse.json({ success: false, error: "提交线索失败，请检查数据库迁移是否已执行" }, { status: 500 });
  }
}
