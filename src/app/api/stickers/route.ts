import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/liwei-fs";
import { isAdminRequest } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

type StickerData = { stickers: Record<string, unknown>; files: string[] };

async function readStickers(): Promise<StickerData> {
  const stickers = await readJson<Record<string, unknown>>("stickers.json", {});
  return { stickers, files: [] };
}

export async function GET() {
  const data = await readStickers();
  return NextResponse.json({ ok: true, ...data });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "无权限：仅管理员可修改贴纸配置" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const stickers = body?.stickers && typeof body.stickers === "object" ? body.stickers : {};
    const result = await writeJson("stickers.json", stickers);
    return NextResponse.json(result.ok ? { ok: true } : result);
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "无权限：仅管理员可删除贴纸" }, { status: 401 });
  }
  const file = request.nextUrl.searchParams.get("file") || "";
  if (!file) {
    return NextResponse.json({ ok: false, error: "缺少 file 参数" }, { status: 400 });
  }
  return NextResponse.json({
    ok: false,
    error: "贴纸图片由 3D 项目的本地 Vite 工具上传，Next.js 环境不支持删除文件。",
  });
}
