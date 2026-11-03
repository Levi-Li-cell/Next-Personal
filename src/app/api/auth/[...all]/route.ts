import { auth } from "@/lib/auth/server";
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";
import { verifySignupCaptcha } from "@/lib/auth/turnstile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = toNextJsHandler(auth);

function toMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function internalError(error: unknown) {
  const isProd = process.env.NODE_ENV === "production";
  const message = isProd ? "Authentication failed" : toMessage(error);
  return NextResponse.json(
    { code: "AUTH_INTERNAL_ERROR", message },
    { status: 500 },
  );
}

export async function GET(request: Request) {
  try {
    return await handler.GET(request);
  } catch (error) {
    console.error("[better-auth] GET handler error", error);
    return internalError(error);
  }
}

export async function POST(request: Request) {
  try {
    if (new URL(request.url).pathname.replace(/\/+$/, "") === "/api/auth/sign-up/email") {
      const verification = await verifySignupCaptcha(request.headers.get("x-turnstile-token"));
      if (!verification.success) {
        return NextResponse.json({ code: verification.code, message: verification.error }, { status: verification.status });
      }
    }
    return await handler.POST(request);
  } catch (error) {
    console.error("[better-auth] POST handler error", error);
    return internalError(error);
  }
}
