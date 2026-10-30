import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireGameAdmin } from "@/lib/admin/game-auth";
import { isGameHtmlFilename, MAX_GAME_HTML_BYTES, validateGameHtmlFile } from "@/lib/game-assets";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const denied = await requireGameAdmin();
    if (denied) return denied;

    const filename = new URL(request.url).searchParams.get("filename") || "";
    if (!isGameHtmlFilename(filename)) {
      return NextResponse.json({ success: false, error: "请选择 .html 或 .htm 文件" }, { status: 400 });
    }
    if (Number(request.headers.get("content-length")) > MAX_GAME_HTML_BYTES) {
      return NextResponse.json({ success: false, error: "HTML 文件不能超过 4 MB" }, { status: 413 });
    }
    if (!request.body) {
      return NextResponse.json({ success: false, error: "HTML 文件不能为空" }, { status: 400 });
    }

    // Bound the stream even when the caller omits Content-Length.
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_GAME_HTML_BYTES) {
          await reader.cancel();
          return NextResponse.json({ success: false, error: "HTML 文件不能超过 4 MB" }, { status: 413 });
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const validationError = validateGameHtmlFile({ name: filename, size });
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }
    const bytes = Buffer.concat(chunks);
    let html: string;
    try {
      html = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      return NextResponse.json({ success: false, error: "请上传 UTF-8 编码的 HTML 文件" }, { status: 400 });
    }
    if (!/<(?:!doctype\s+html|html|head|body)(?:\s|>)/i.test(html) || html.includes("\0")) {
      return NextResponse.json({ success: false, error: "文件不是有效的 HTML 文档" }, { status: 400 });
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ success: false, error: "文件存储未配置，请设置 BLOB_READ_WRITE_TOKEN" }, { status: 503 });
    }
    const blob = await put(`games/html/${nanoid()}.html`, bytes, {
      access: "public",
      contentType: "text/html; charset=utf-8",
      addRandomSuffix: true,
    });
    return NextResponse.json({ success: true, data: { url: blob.url, filename, size } });
  } catch (error) {
    console.error("Failed to upload game HTML:", error);
    return NextResponse.json({ success: false, error: "HTML 上传失败，请稍后重试" }, { status: 500 });
  }
}
