import { NextRequest, NextResponse } from "next/server";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body?.token || "").trim();

    if (!token) {
      return NextResponse.json({ success: false, error: "缺少验证码令牌" }, { status: 400 });
    }

    const secret = String(process.env.TURNSTILE_SECRET_KEY || "").trim();
    if (!secret) {
      return NextResponse.json({ success: false, error: "验证码服务未配置" }, { status: 500 });
    }

    const formData = new URLSearchParams();
    formData.set("secret", secret);
    formData.set("response", token);

    const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0]?.trim();
    if (ip) {
      formData.set("remoteip", ip);
    }

    const verifyResponse = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
      cache: "no-store",
    });

    const verifyData = await verifyResponse.json();
    if (!verifyData?.success) {
      return NextResponse.json(
        {
          success: false,
          error: "验证码校验失败",
          details: verifyData?.["error-codes"] || [],
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("验证码校验接口失败:", error);
    return NextResponse.json({ success: false, error: "验证码校验接口失败" }, { status: 500 });
  }
}
