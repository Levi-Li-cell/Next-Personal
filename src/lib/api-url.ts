type ApiKind = "frontend" | "admin";

function normalizeBaseUrl(value?: string) {
  return (value || "").trim().replace(/\/+$/, "");
}

function isLocalhost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/**
 * Resolve API base URL.
 * Browser: always prefer same-origin to avoid dead cross-domain hosts
 * (e.g. NEXT_PUBLIC_FRONTEND_API_URL pointing at unresolvable DNS).
 * Override base still wins when explicitly provided by caller.
 */
export function resolveApiBase(kind: ApiKind = "frontend", overrideBase?: string) {
  const normalizedOverride = normalizeBaseUrl(overrideBase);
  if (normalizedOverride) return normalizedOverride;

  if (typeof window !== "undefined") {
    if (isLocalhost(window.location.hostname)) {
      return "http://localhost:3000";
    }
    // Production / preview: same-origin only
    return window.location.origin;
  }

  const envBase = normalizeBaseUrl(
    kind === "admin" ? process.env.NEXT_PUBLIC_ADMIN_API_URL : process.env.NEXT_PUBLIC_FRONTEND_API_URL
  );
  return envBase;
}

export function withApiBase(path: string, kind: ApiKind = "frontend", overrideBase?: string) {
  const base = resolveApiBase(kind, overrideBase);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalizedPath}` : normalizedPath;
}
