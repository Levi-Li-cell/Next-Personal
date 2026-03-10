type ApiKind = "frontend" | "admin";

function normalizeBaseUrl(value?: string) {
  return (value || "").trim().replace(/\/+$/, "");
}

function isLocalhost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function resolveApiBase(kind: ApiKind = "frontend", overrideBase?: string) {
  const normalizedOverride = normalizeBaseUrl(overrideBase);
  if (normalizedOverride) return normalizedOverride;

  const envBase = normalizeBaseUrl(
    kind === "admin" ? process.env.NEXT_PUBLIC_ADMIN_API_URL : process.env.NEXT_PUBLIC_FRONTEND_API_URL
  );

  if (typeof window !== "undefined") {
    if (isLocalhost(window.location.hostname)) {
      return "http://localhost:3000";
    }
    return envBase || window.location.origin;
  }

  return envBase;
}

export function withApiBase(path: string, kind: ApiKind = "frontend", overrideBase?: string) {
  const base = resolveApiBase(kind, overrideBase);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalizedPath}` : normalizedPath;
}
