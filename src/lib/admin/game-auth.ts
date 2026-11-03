import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/require-admin";

export async function requireGameAdmin() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, error: "仅管理员可以管理游戏" }, { status: 403 });
  }
  return null;
}
