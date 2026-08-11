import { NextResponse } from "next/server";
import { writeJson } from "@/lib/liwei-fs";
import { isAdminRequest } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "无权限：仅管理员可修改运镜配置" }, { status: 401 });
  }
  try {
    const config = await request.json();
    const result = await writeJson("director/camera-overrides.json", config);
    return NextResponse.json(result.ok ? { ok: true, status: "已写入 public/liwei/director/camera-overrides.json" } : result);
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
