import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/require-admin";
import { createSnapshot, listSnapshots } from "@/lib/liwei-snapshots";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "无权限：仅管理员可保存快照" }, { status: 401 });
  }
  try {
    await createSnapshot("手动快照");
    return NextResponse.json({ ok: true, snapshots: await listSnapshots() });
  } catch (error) {
    console.error("snapshot error:", error);
    return NextResponse.json({
      ok: false,
      error: "保存快照需要在本地可写文件系统上运行，当前环境不支持。",
    });
  }
}
