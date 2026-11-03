const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function expectedHostnames() {
  const explicit = (process.env.TURNSTILE_HOSTNAMES || "").split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
  const hosts = new Set(explicit);
  if (!explicit.length) {
    for (const value of [process.env.NEXT_PUBLIC_BASE_URL, process.env.BETTER_AUTH_URL, process.env.NEXT_PUBLIC_BETTER_AUTH_URL]) {
      if (!value?.trim()) continue;
      try { hosts.add(new URL(value.trim()).hostname.toLowerCase()); } catch { /* Invalid deployment URLs are not trusted. */ }
    }
  }
  if (process.env.NODE_ENV !== "production") {
    hosts.add("localhost");
    hosts.add("127.0.0.1");
  } else {
    hosts.delete("localhost");
    hosts.delete("127.0.0.1");
    hosts.delete("[::1]");
  }
  return hosts;
}

type VerificationResult = { success: true } | { success: false; status: number; code: string; error: string };

export async function verifySignupCaptcha(token: unknown): Promise<VerificationResult> {
  if (typeof token !== "string" || !token.trim() || token.length > 2048) {
    return { success: false, status: 400, code: "CAPTCHA_TOKEN_REQUIRED", error: "请先完成人机验证" };
  }
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const hosts = expectedHostnames();
  if (!secret || hosts.size === 0) {
    return { success: false, status: 503, code: "CAPTCHA_NOT_CONFIGURED", error: "验证码服务配置不完整，请联系管理员" };
  }
  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Siteverify unavailable");
    const data = await response.json();
    if (data?.success !== true) {
      const codes: unknown[] = Array.isArray(data?.["error-codes"]) ? data["error-codes"] : [];
      if (codes.includes("invalid-input-secret") || codes.includes("missing-input-secret")) {
        return { success: false, status: 503, code: "CAPTCHA_SECRET_INVALID", error: "验证码服务密钥配置有误，请联系管理员" };
      }
      return { success: false, status: 403, code: "CAPTCHA_REJECTED", error: "验证码无效或已过期，请重新验证" };
    }
    if (data.action !== "signup" || typeof data.hostname !== "string" || !hosts.has(data.hostname.toLowerCase())) {
      return { success: false, status: 403, code: "CAPTCHA_CONTEXT_MISMATCH", error: "验证码站点配置不匹配，请联系管理员" };
    }
    return { success: true };
  } catch {
    return { success: false, status: 503, code: "CAPTCHA_UNAVAILABLE", error: "验证码服务暂时无法连接，请稍后重试" };
  }
}
