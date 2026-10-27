"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Expand, Gamepad2, Minimize, MousePointerClick } from "lucide-react";

import { AbyssalHostBridge } from "@/lib/awp";
import RendererInspector from "@/components/abyssal/RendererInspector";

/**
 * 深渊之井（ABYSSAL WELL）运行时容器。
 *
 * 架构：游戏本体是 public/games/abyssal-well.html 里的原生 WebGL2 引擎
 * （零依赖、可独立双击运行），本组件只承担三件事——
 *   1. 以 iframe 承载引擎（隔离边界：引擎崩溃不波及站点）；
 *   2. 通过 AWP/1 postMessage 协议驱动引擎（视图 / uniform / seed / 快照）；
 *   3. 把 bridge 交给渲染器检查器面板，遥测在面板内消化。
 */

/** public/ 无内容指纹，每次更新游戏后递增此版本号以击穿缓存 */
const AW_GAME_VERSION = "2";
const AW_GAME_SRC = `/games/abyssal-well.html?v=${AW_GAME_VERSION}`;

/** 父组件可通过 ref 调用全屏切换（按钮由宿主页面渲染在全屏元素之外） */
export interface AbyssalWellHandle {
  toggleFullscreen: () => void;
}

interface AbyssalWellProps {
  variant?: "page" | "embedded";
  /** 全屏状态变化时通知宿主（宿主用它切换自家按钮图标） */
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

const AbyssalWell = forwardRef<AbyssalWellHandle, AbyssalWellProps>(function AbyssalWell(
  { variant = "page", onFullscreenChange },
  ref,
) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  // 桥接实例惰性创建（构造器不触碰 window，SSR 安全），effect 只负责挂载订阅
  const [bridge] = useState(() => new AbyssalHostBridge());
  const [connected, setConnected] = useState(false);
  const [focused, setFocused] = useState(false);
  const [rafFallback, setRafFallback] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const off = bridge.on((e) => {
      switch (e.type) {
        case "hello":
          setConnected(true);
          break;
        case "rafFallback":
          setRafFallback(e.on);
          break;
        case "error":
          setConnected(false);
          break;
      }
    });
    if (frameRef.current?.contentWindow) {
      bridge.attach(frameRef.current.contentWindow);
    }
    return () => {
      off();
      bridge.detach();
    };
  }, [bridge]);

  // 全屏时 iframe 必须撑满舞台：固定高度会让引擎保持进入前的小画布，
  // 内部 window 的 resize 事件会随尺寸变化触发，游戏自行重算整数倍缩放
  useEffect(() => {
    const onFsChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      onFullscreenChange?.(active);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [onFullscreenChange]);

  /** iframe 内的键盘操作需要文档焦点；覆盖层在首次点击后让位 */
  const focusGame = useCallback(() => {
    frameRef.current?.focus();
    setFocused(true);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = shellRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen().catch(() => {});
  }, []);

  useImperativeHandle(ref, () => ({ toggleFullscreen }), [toggleFullscreen]);

  const embedded = variant === "embedded";

  return (
    <div className={embedded ? "w-full p-3" : "mx-auto w-full max-w-[1400px] px-4"}>
      {/* 页头（embedded 模式下由宿主详情页提供标题区，此处省略） */}
      {!embedded && (
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#10181c] md:text-3xl">
              深渊之井{" "}
              <span className="bg-gradient-to-r from-[#0f766e] to-[#155e75] bg-clip-text font-mono text-xl text-transparent md:text-2xl">
                ABYSSAL WELL
              </span>
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[#5a6b72]">
              原生 WebGL2 像素洞穴引擎 · MRT 延迟渲染 · 双纹理程序化资产 · Ping-Pong GPU 流体。
              右侧检查器通过 <span className="font-mono text-[#0f766e]">AWP/1</span> 协议实时驱动引擎——
              拖动滑杆、切换 G-Buffer 通道、换一个种子重建整个洞穴。
            </p>
          </div>
          {rafFallback && (
            <span className="rounded-md border border-[#b45309]/30 bg-[#78350f]/10 px-2 py-1 font-mono text-[10px] text-[#92400e]">
              rAF 降级 · 定时器循环
            </span>
          )}
        </header>
      )}
      {embedded && rafFallback && (
        <div className="mb-2 flex justify-end">
          <span className="rounded-md border border-[#b45309]/30 bg-[#78350f]/10 px-2 py-1 font-mono text-[10px] text-[#92400e]">
            rAF 降级 · 定时器循环
          </span>
        </div>
      )}

      <div className="flex flex-col gap-4 xl:flex-row">
        {/* 游戏舞台 */}
        <div
          ref={shellRef}
          className={`relative flex-1 overflow-hidden border border-[#0f2a30] bg-[#03060a] shadow-[0_30px_120px_-40px_rgba(0,0,0,.8)] ${
            isFullscreen ? "rounded-none" : "rounded-xl"
          }`}
        >
          {/* 全屏时用 fixed 定位直接铺满视口：h-full 依赖父级高度链，
              在部分浏览器的 :fullscreen UA 样式下解析不到视口高度会缩回去 */}
          <iframe
            ref={frameRef}
            src={AW_GAME_SRC}
            title="ABYSSAL WELL — WebGL2 像素洞穴光影沙盒"
            className={`block border-0 ${
              isFullscreen ? "fixed inset-0 h-screen w-screen" : "h-[520px] w-full md:h-[640px]"
            }`}
            allow="fullscreen"
            tabIndex={0}
          />
          {/* 全屏切换按钮：embedded 模式下，非全屏时完全隐藏（按钮由宿主详情页放在返回行）；
              仅在全屏后宿主按钮不可见时，舞台内才出现退出入口（Esc 亦可）；
              page 模式（非 embedded）则始终在舞台内提供入口 */}
          {(isFullscreen || !embedded) && (
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? "退出全屏 (Esc)" : "全屏"}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-md border border-[#0f2a30] bg-[#04090e]/85 text-[#9fc4bd] backdrop-blur-sm transition-colors hover:border-[#1d4a4a] hover:text-[#6fe0c6]"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
            </button>
          )}
          {!focused && (
            <button
              type="button"
              onClick={focusGame}
              className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-3 bg-[#03060a]/72 backdrop-blur-[2px]"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#6fe0c6]/40 bg-[#071118]/80">
                <Gamepad2 className="h-6 w-6 text-[#6fe0c6]" />
              </span>
              <span className="font-mono text-[12px] uppercase tracking-[0.3em] text-[#9dfce3]">
                点击进入洞穴
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.12em] text-[#5d7a78]">
                <MousePointerClick className="h-3 w-3" />
                A / D 移动 · W / Space 跳跃 · 鼠标探照灯 · 1–8 渲染通道
              </span>
            </button>
          )}
        </div>

        {/* 渲染器检查器（全屏时随舞台独占，自然隐藏） */}
        {!isFullscreen && <RendererInspector bridge={bridge} connected={connected} />}
      </div>

      {/* 引擎档案（embedded 模式下省略） */}
      {!embedded && (
        <footer className="mt-5 grid gap-3 text-[11px] leading-relaxed text-[#5a6b72] sm:grid-cols-3">
          <div className="rounded-lg border border-[#e5decf] bg-white/60 p-3">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#0f766e]">Engine</div>
            单文件原生 WebGL2 / GLSL ES 3.00，7 个着色器程序；G-Buffer 3×RGBA16F MRT；384×216 虚拟分辨率整数放大。
          </div>
          <div className="rounded-lg border border-[#e5decf] bg-white/60 p-3">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#0f766e]">Protocol</div>
            AWP/1 postMessage：视图切换、uniform 调参、种子重建、帧内同步快照、周期遥测。独立打开时协议静默。
          </div>
          <div className="rounded-lg border border-[#e5decf] bg-white/60 p-3">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#0f766e]">World</div>
            种子驱动的确定性洞穴：噪声雕刻 + 元胞自动机 + 双画廊走廊保证连通。seed 即世界地址，可分享。
          </div>
        </footer>
      )}
    </div>
  );
});

export default AbyssalWell;
