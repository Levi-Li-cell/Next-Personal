export const MAX_GAME_HTML_BYTES = 4 * 1024 * 1024;

export function isGameHtmlFilename(name: string) {
  return /\.html?$/i.test(name);
}

export function isSafeGameUrl(value: string) {
  if (!value || /[\\\u0000-\u0020]/.test(value)) return false;
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function isUploadedGameHtmlUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      /^[a-z0-9]+\.public\.blob\.vercel-storage\.com$/.test(url.hostname) &&
      /^\/games\/html\/[a-zA-Z0-9_-]+\.html$/.test(url.pathname) &&
      !url.username && !url.password && !url.port && !url.search && !url.hash;
  } catch {
    return false;
  }
}

export function validateGameHtmlFile(file: { name: string; size: number }) {
  if (!isGameHtmlFilename(file.name)) return "请选择 .html 或 .htm 文件";
  if (file.size === 0) return "HTML 文件不能为空";
  if (file.size > MAX_GAME_HTML_BYTES) return "HTML 文件不能超过 4 MB";
  return null;
}
