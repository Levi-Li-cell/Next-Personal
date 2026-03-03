import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema/auth/user";
import { eq } from "drizzle-orm";

// GET /api/admin/users/[id] - 获取用户详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [foundUser] = await db.select().from(user).where(eq(user.id, id));

    if (!foundUser) {
      return NextResponse.json(
        { success: false, error: "用户不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: foundUser });
  } catch (error) {
    console.error("获取用户详情失败:", error);
    return NextResponse.json(
      { success: false, error: "获取用户详情失败" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - 更新用户
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, username, email, role, image } = body;

    // 检查用户是否存在
    const [existingUser] = await db.select().from(user).where(eq(user.id, id));
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "用户不存在" },
        { status: 404 }
      );
    }

    // 更新用户
    const [updatedUser] = await db
      .update(user)
      .set({
        name,
        username,
        email,
        role,
        image,
        updatedAt: new Date(),
      })
      .where(eq(user.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("更新用户失败:", error);
    return NextResponse.json(
      { success: false, error: "更新用户失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - 删除用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 检查用户是否存在
    const [existingUser] = await db.select().from(user).where(eq(user.id, id));
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "用户不存在" },
        { status: 404 }
      );
    }

    // 防止删除管理员自己
    // 可以添加更多保护逻辑

    // 删除用户
    await db.delete(user).where(eq(user.id, id));

    return NextResponse.json({ success: true, message: "用户已删除" });
  } catch (error) {
    console.error("删除用户失败:", error);
    return NextResponse.json(
      { success: false, error: "删除用户失败" },
      { status: 500 }
    );
  }
}
