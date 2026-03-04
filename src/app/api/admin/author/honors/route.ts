import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { authorHonor } from "@/db/schema/author";
import { eq, desc, asc } from "drizzle-orm";
import { nanoid } from "nanoid";

// GET /api/admin/author/honors - 获取荣誉证书列表
export async function GET() {
  try {
    const honors = await db
      .select()
      .from(authorHonor)
      .orderBy(asc(authorHonor.sortOrder), desc(authorHonor.createdAt));

    return NextResponse.json({
      success: true,
      data: honors,
    });
  } catch (error) {
    console.error("获取荣誉证书失败:", error);
    return NextResponse.json(
      { success: false, error: "获取荣誉证书失败" },
      { status: 500 }
    );
  }
}

// POST /api/admin/author/honors - 创建荣誉证书
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const [created] = await db
      .insert(authorHonor)
      .values({
        id: nanoid(),
        title: body.title,
        issuer: body.issuer,
        date: body.date,
        description: body.description,
        imageUrl: body.imageUrl,
        sortOrder: body.sortOrder || "0",
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: created,
      message: "荣誉证书创建成功",
    });
  } catch (error) {
    console.error("创建荣誉证书失败:", error);
    return NextResponse.json(
      { success: false, error: "创建荣誉证书失败" },
      { status: 500 }
    );
  }
}
