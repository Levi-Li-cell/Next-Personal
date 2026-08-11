import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "无权限：仅管理员可执行重建" }, { status: 401 });
  }
  return NextResponse.json({
    ok: false,
    error: "GLB 烘焙需要 3D 项目本地的 Vite 开发工具支持，Next.js 环境无法生成模型文件。",
  });
}
