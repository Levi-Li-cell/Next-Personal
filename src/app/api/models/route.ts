import { NextRequest, NextResponse } from "next/server";
import { listFiles, readJson, writeJson } from "@/lib/liwei-fs";
import { isAdminRequest } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const files = await listFiles("models", ".glb");
  const selection = await readJson<{ selected?: string }>("models/model-selection.json", {});
  return NextResponse.json({ ok: true, files, selected: selection.selected || "" });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "无权限：仅管理员可切换模型" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const selected = String(body?.selected || "");
    if (!selected) {
      return NextResponse.json({ ok: false, error: "缺少 selected 参数" }, { status: 400 });
    }
    const result = await writeJson("models/model-selection.json", { selected });
    return NextResponse.json(result.ok ? { ok: true } : result);
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
