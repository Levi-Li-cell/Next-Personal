import { NextRequest, NextResponse } from "next/server";
import { verifySignupCaptcha } from "@/lib/auth/turnstile";

// Diagnostic only; signup must independently validate a fresh token.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const result = await verifySignupCaptcha(body?.token);
  return NextResponse.json(result, { status: result.success ? 200 : result.status });
}
