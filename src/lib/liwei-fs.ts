import { promises as fs } from "fs";
import path from "path";

export const LIWEI_PUBLIC_DIR = path.join(process.cwd(), "public", "liwei");

export async function readJson<T>(relPath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(LIWEI_PUBLIC_DIR, relPath), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(relPath: string, value: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const full = path.join(LIWEI_PUBLIC_DIR, relPath);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, JSON.stringify(value, null, 2), "utf-8");
    return { ok: true };
  } catch (error) {
    console.error(`Failed to write public/liwei/${relPath}:`, error);
    return {
      ok: false,
      error: "当前环境无法写入静态资源（Serverless/只读文件系统），请在本地开发环境使用该功能。",
    };
  }
}

export async function listFiles(dir: string, ext: string): Promise<string[]> {
  try {
    const full = path.join(LIWEI_PUBLIC_DIR, dir);
    const entries = await fs.readdir(full, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(ext))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}
