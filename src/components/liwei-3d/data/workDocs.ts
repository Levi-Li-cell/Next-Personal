// @ts-nocheck
// 作品详情内容规范：每个作品一个 markdown 文件（Next 版为静态导入，无 Vite import.meta.glob）。
export interface WorkDoc {
  slug: string;
  title?: string;
  banner?: string;
  year?: string;
  role?: string;
  tags?: string[];
  link?: string;
  body: string;
}

// 极简 frontmatter 解析（key: value，数组用 [a, b]）
function parseFrontmatter(raw: string): { data: Record<string, string | string[]>; body: string } {
  const m = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(raw);
  if (!m) return { data: {}, body: raw };
  const data: Record<string, string | string[]> = {};
  for (const line of m[1].split('\n')) {
    const mm = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line.trim());
    if (!mm) continue;
    const rawVal = mm[2].trim();
    let val: string | string[];
    if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
      val = rawVal.slice(1, -1).split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    } else {
      val = rawVal.replace(/^['"]|['"]$/g, '');
    }
    data[mm[1]] = val;
  }
  return { data, body: m[2].trim() };
}

// 作品详情文档（slug -> md 原文）。当前内置示例文档；新增作品时在此追加。
const DOCS: Record<string, string> = {};

const docs: Record<string, WorkDoc> = {};
for (const slug in DOCS) {
  const { data, body } = parseFrontmatter(DOCS[slug]);
  docs[slug] = { slug, ...data, body } as WorkDoc;
}

export function getWorkDoc(slug?: string): WorkDoc | null {
  return slug ? docs[slug] || null : null;
}
