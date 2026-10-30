"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Loader2, Minimize, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { isUploadedGameHtmlUrl, MAX_GAME_HTML_BYTES } from "@/lib/game-assets";

export interface HtmlGameHandle {
  toggleFullscreen: () => void;
}

interface HtmlGameProps {
  url: unknown;
  title: string;
  preview?: boolean;
  onFullscreenChange?: (active: boolean) => void;
}

const HtmlGame = forwardRef<HtmlGameHandle, HtmlGameProps>(function HtmlGame({ url, title, preview = false, onFullscreenChange }, ref) {
  const shell = useRef<HTMLDivElement>(null);
  const [source, setSource] = useState<{ url: string; html: string } | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    let cancelled = false;
    async function load() {
      setSource(null);
      setError("");
      try {
        if (!isUploadedGameHtmlUrl(url)) throw new Error("游戏文件地址无效");
        // Blob may serve HTML as text/plain. Fetch as text, then execute only in an opaque-origin sandbox.
        const response = await fetch(url, { credentials: "omit", signal: controller.signal });
        if (!response.ok) throw new Error("游戏文件加载失败");
        const blob = await response.blob();
        if (!blob.size || blob.size > MAX_GAME_HTML_BYTES) throw new Error("游戏文件大小无效");
        const html = await blob.text();
        if (!cancelled) setSource({ url, html });
      } catch (error) {
        if (!cancelled) setError(controller.signal.aborted ? "游戏加载超时，请重试" : error instanceof Error ? error.message : "游戏加载失败");
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void load();
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [url, attempt]);

  useEffect(() => {
    const handleChange = () => {
      const active = document.fullscreenElement === shell.current;
      setFullscreen(active);
      onFullscreenChange?.(active);
    };
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, [onFullscreenChange]);

  const toggleFullscreen = useCallback(() => {
    const action = document.fullscreenElement ? document.exitFullscreen() : shell.current?.requestFullscreen?.();
    if (!action) {
      toast.error("当前浏览器不支持全屏");
      return;
    }
    void action.catch(() => toast.error("无法进入全屏，请重试"));
  }, []);
  useImperativeHandle(ref, () => ({ toggleFullscreen }), [toggleFullscreen]);

  return (
    <div ref={shell} className={`relative w-full min-w-0 overflow-hidden border border-ink/14 bg-white ${fullscreen ? "h-screen" : preview ? "h-80 rounded-lg" : "h-[420px] rounded-lg md:h-[540px]"}`}>
      {error ? (
        <div role="alert" className="flex h-full flex-col items-center justify-center gap-3 p-6 text-sm text-neutral-600">
          <p>{error}</p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)} className="inline-flex items-center gap-2 rounded-md border px-3 py-2"><RotateCcw className="size-4" />重试</button>
        </div>
      ) : source && source.url === url ? (
        <iframe
          key={`${source.url}-${attempt}`}
          title={title}
          srcDoc={source.html}
          sandbox="allow-scripts allow-pointer-lock"
          allow="autoplay; fullscreen"
          referrerPolicy="no-referrer"
          className="block h-full w-full border-0"
        />
      ) : (
        <div role="status" className="flex h-full items-center justify-center gap-2 text-sm text-neutral-600"><Loader2 className="size-4 animate-spin" />正在加载游戏...</div>
      )}
      {fullscreen && (
        <button type="button" onClick={toggleFullscreen} aria-label="退出全屏" title="退出全屏" className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-md border bg-white text-black"><Minimize className="size-4" /></button>
      )}
    </div>
  );
});

export default HtmlGame;
