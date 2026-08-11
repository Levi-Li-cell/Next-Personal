import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/require-admin";
import { createSnapshot, listSnapshots, restoreClean, restoreSnapshot } from "@/lib/liwei-snapshots";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshots = await listSnapshots();
  return NextResponse.json({ ok: true, snapshots });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "无权限：仅管理员可执行快照/回滚" }, { status: 401 });
  }
  const url = new URL(request.url);
  const to = url.searchParams.get("to") || "";

  try {
    if (to === "clean") {
      await restoreClean();
      return NextResponse.json({ ok: true, snapshots: await listSnapshots(), baked: false });
    }
    if (to) {
      await restoreSnapshot(to);
      return NextResponse.json({ ok: true, snapshots: await listSnapshots(), baked: false });
    }
    await createSnapshot("手动快照");
    return NextResponse.json({ ok: true, snapshots: await listSnapshots() });
  } catch (error) {
    console.error("snapshot/rollback error:", error);
    return NextResponse.json({
      ok: false,
      error: "快照/回滚需要在本地可写文件系统上运行，当前环境不支持。",
    });
  }
}
