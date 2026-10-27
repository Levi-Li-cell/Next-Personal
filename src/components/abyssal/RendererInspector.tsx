"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Camera, Download, RotateCcw, RefreshCw, Radio, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { type AbyssalHostBridge, type AwpEvent, type AwpManifest, type AwpStats, type AwpUniformSpec } from "@/lib/awp";

/* ------------------------------------------------------------------ */
/* 小组件                                                              */
/* ------------------------------------------------------------------ */

/** FPS 折线（最近 90 个采样，纯 SVG，无图表依赖） */
function FpsSparkline({ samples }: { samples: number[] }) {
  const W = 260;
  const H = 44;
  const MAX = 72; // fps 上限（超过按满格处理）
  const pts = useMemo(() => {
    if (samples.length < 2) return "";
    const step = W / (samples.length - 1);
    return samples
      .map((v, i) => `${(i * step).toFixed(1)},${(H - (Math.min(v, MAX) / MAX) * (H - 4) - 2).toFixed(1)}`)
      .join(" ");
  }, [samples]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-11 w-full" preserveAspectRatio="none">
      <line
        x1="0"
        y1={H - ((60 / MAX) * (H - 4) + 2)}
        x2={W}
        y2={H - ((60 / MAX) * (H - 4) + 2)}
        stroke="rgba(111,224,198,.18)"
        strokeDasharray="3 4"
        strokeWidth="1"
      />
      {pts && (
        <polyline
          points={pts}
          fill="none"
          stroke="#6fe0c6"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function StatCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-[#12333a] bg-[#071118] px-2.5 py-1.5">
      <div className="text-[9px] uppercase tracking-[0.22em] text-[#5d7a78]">{label}</div>
      <div className={`mt-0.5 truncate font-mono text-[12px] ${accent ? "text-[#ffbe7a]" : "text-[#d6e6e1]"}`}>
        {value}
      </div>
    </div>
  );
}

function SectionTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.3em] text-[#6d8a89]">
      {icon && <span className="text-[#4d6a68]">{icon}</span>}
      {children}
    </div>
  );
}

function describeEvent(e: AwpEvent): string | null {
  switch (e.type) {
    case "view":
      return `VIEW · ${e.ok ? "ok" : "rejected"} → ${e.view}`;
    case "uniform":
      return `UNIFORM · ${e.key}=${e.value}`;
    case "uniforms":
      return `UNIFORMS · ${e.uniforms.length} reset`;
    case "flag":
      return `FLAG · ${e.key}=${e.value}`;
    case "seeded":
      return `SEEDED · seed=${e.seed}`;
    case "capture":
      return `CAPTURE · ${e.width}×${e.height} png`;
    case "nack":
      return `NACK · ${e.reason}`;
    case "error":
      return `ERROR · ${e.message}`;
    case "rafFallback":
      return "RAF_FALLBACK · timer loop";
    case "pong":
      return `PONG · v${e.version}`;
    case "hello":
      return `HELLO · v${e.manifest.version} · ${e.manifest.views.length} views · seed=${e.manifest.seed}`;
    case "manifest":
      return `MANIFEST · ${e.manifest.uniforms.length} uniforms`;
    case "state":
      return `STATE · view=${e.state.view} seed=${e.state.seed}`;
    default:
      return null; // stats 太吵，不进日志
  }
}

/* ------------------------------------------------------------------ */
/* 检查器主体                                                          */
/* ------------------------------------------------------------------ */

const QUICK_SEEDS = ["liwei", "1337", "abyss", "2026"];
const DEFAULT_VIEWS = ["FINAL", "ALBEDO", "NORMAL", "EMISSIVE", "LIGHTING", "FLUID", "VELOCITY", "BLOOM"];

export interface RendererInspectorProps {
  bridge: AbyssalHostBridge | null;
  connected: boolean;
}

/**
 * 渲染器检查器：直接订阅 AWP/1 事件流（外部系统订阅模式），
 * 把引擎的能力清单渲染成滑杆与开关，把遥测渲染成图表。
 * 引擎返回的确认事件是本地 UI 状态的唯一权威。
 */
export default function RendererInspector({ bridge, connected }: RendererInspectorProps) {
  const [manifest, setManifest] = useState<AwpManifest | null>(null);
  const [uniforms, setUniforms] = useState<Record<string, number>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({ fluid: true, bloom: true, ui: true });
  const [seedDraft, setSeedDraft] = useState("");
  const [capture, setCapture] = useState<string | null>(null);
  const [view, setView] = useState("FINAL");
  const [fpsSamples, setFpsSamples] = useState<number[]>([]);
  const [stats, setStats] = useState<AwpStats | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);

  useEffect(() => {
    if (!bridge) return;
    return bridge.on((e: AwpEvent) => {
      switch (e.type) {
        case "hello":
        case "manifest": {
          const m = e.manifest;
          setManifest(m);
          {
            const next: Record<string, number> = {};
            for (const u of m.uniforms) next[u.key] = u.v;
            setUniforms(next);
          }
          break;
        }
        case "uniforms": {
          const next: Record<string, number> = {};
          for (const u of e.uniforms) next[u.key] = u.v;
          setUniforms(next);
          break;
        }
        case "uniform":
          setUniforms((prev) => ({ ...prev, [e.key]: e.value }));
          break;
        case "flag":
          setFlags((prev) => ({ ...prev, [e.key]: e.value }));
          break;
        case "view":
          if (e.ok) setView(e.view);
          break;
        case "seeded":
          setSeedDraft("");
          break;
        case "capture":
          setCapture(e.dataURL);
          break;
        case "stats":
          setStats(e.stats);
          setFpsSamples((prev) => [...prev.slice(-89), e.stats.fps]);
          break;
      }
      const line = describeEvent(e);
      if (line) setLogLines((prev) => [line, ...prev.slice(0, 11)]);
    });
  }, [bridge]);

  const onView = useCallback((v: string) => bridge?.setView(v), [bridge]);
  const onUniform = useCallback((key: string, value: number) => bridge?.setUniform(key, value), [bridge]);
  const onResetUniforms = useCallback(() => bridge?.resetUniform(), [bridge]);
  const onFlag = useCallback((key: string, value: boolean) => bridge?.setFlag(key, value), [bridge]);
  const onRegen = useCallback((s: string | number) => bridge?.regen(s), [bridge]);
  const onCapture = useCallback(() => bridge?.capture(`inspector-${Date.now()}`), [bridge]);

  const statsCells: Array<{ label: string; value: string; accent?: boolean }> = stats
    ? [
        { label: "frame", value: `${stats.frameMs.toFixed(1)} ms` },
        { label: "draw calls", value: String(stats.drawCalls) },
        { label: "quads", value: String(stats.quads) },
        { label: "lights", value: `${stats.lights}/${stats.maxLights}` },
        { label: "zone", value: stats.zone ?? "—", accent: true },
        { label: "camera", value: stats.cam.join(", ") },
      ]
    : [];

  return (
    <aside className="flex w-full flex-col gap-5 rounded-xl border border-[#0f2a30] bg-[#04090e] p-4 font-mono shadow-[0_20px_80px_-30px_rgba(0,0,0,.9)] xl:w-[340px] xl:shrink-0">
      {/* 连接状态 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {connected && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6fe0c6] opacity-60" />
            )}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${connected ? "bg-[#6fe0c6]" : "bg-[#c96a5e]"}`} />
          </span>
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#9fc4bd]">
            {connected ? "AWP/1 LIVE" : "ENGINE OFFLINE"}
          </span>
        </div>
        <Badge variant="outline" className="border-[#1d4a4a] bg-transparent font-mono text-[9px] text-[#6fe0c6]">
          v{manifest?.version ?? "—"}
        </Badge>
      </div>

      {/* 渲染通道 */}
      <section>
        <SectionTitle icon={<Radio className="h-3 w-3" />}>渲染通道 · G-Buffer Inspect</SectionTitle>
        <div className="grid grid-cols-4 gap-1.5">
          {(manifest?.views ?? DEFAULT_VIEWS).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onView(v)}
              className={`rounded-md border px-1 py-1.5 text-[8.5px] uppercase tracking-[0.12em] transition-colors ${
                view === v
                  ? "border-[#6fe0c6] bg-[#6fe0c6] text-[#04120e]"
                  : "border-[#12333a] bg-[#071118] text-[#6d8a89] hover:border-[#1d4a4a] hover:text-[#d6e6e1]"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </section>

      {/* 参数 */}
      <section>
        <div className="flex items-center justify-between">
          <SectionTitle icon={<SlidersHorizontal className="h-3 w-3" />}>实时 Uniform</SectionTitle>
          <button
            type="button"
            onClick={onResetUniforms}
            className="mb-2 flex items-center gap-1 text-[9px] uppercase tracking-[0.18em] text-[#5d7a78] transition-colors hover:text-[#ffbe7a]"
          >
            <RotateCcw className="h-3 w-3" /> 复位
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {(manifest?.uniforms ?? []).map((u: AwpUniformSpec) => (
            <div key={u.key}>
              <div className="mb-1 flex items-baseline justify-between text-[10px]">
                <span className="text-[#8fb0aa]">{u.label}</span>
                <span className="font-mono text-[10px] text-[#6fe0c6]">
                  {(uniforms[u.key] ?? u.v).toFixed(u.step < 0.01 ? 3 : 2)}
                </span>
              </div>
              <Slider
                min={u.min}
                max={u.max}
                step={u.step}
                value={[uniforms[u.key] ?? u.v]}
                onValueChange={(vals) => onUniform(u.key, vals[0])}
              />
            </div>
          ))}
          {!manifest && (
            <div className="rounded-md border border-dashed border-[#12333a] px-3 py-4 text-center text-[10px] text-[#5d7a78]">
              等待引擎握手…
            </div>
          )}
        </div>
      </section>

      {/* 管线开关 */}
      <section>
        <SectionTitle>管线开关</SectionTitle>
        <div className="flex flex-col gap-2">
          {(["fluid", "bloom"] as const).map((k) => (
            <label
              key={k}
              className="flex cursor-pointer items-center justify-between rounded-md border border-[#12333a] bg-[#071118] px-3 py-2"
            >
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#8fb0aa]">
                {k === "fluid" ? "流体模拟 (ping-pong)" : "泛光 (dual bloom)"}
              </span>
              <Switch checked={flags[k]} onCheckedChange={(v) => onFlag(k, v)} />
            </label>
          ))}
        </div>
      </section>

      {/* 遥测 */}
      <section>
        <SectionTitle>遥测</SectionTitle>
        <div className="rounded-md border border-[#12333a] bg-[#071118] px-2 pb-1 pt-2">
          <div className="flex items-baseline justify-between px-1">
            <span className="text-[9px] uppercase tracking-[0.22em] text-[#5d7a78]">fps</span>
            <span className="font-mono text-sm text-[#6fe0c6]">{stats?.fps.toFixed(0) ?? "—"}</span>
          </div>
          <FpsSparkline samples={fpsSamples} />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {statsCells.map((c) => (
            <StatCell key={c.label} label={c.label} value={c.value} accent={c.accent} />
          ))}
        </div>
      </section>

      {/* 世界种子 */}
      <section>
        <SectionTitle>世界种子 · seed = 世界地址</SectionTitle>
        <div className="flex gap-1.5">
          <Input
            value={seedDraft}
            onChange={(e) => setSeedDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && seedDraft.trim()) onRegen(seedDraft.trim());
            }}
            placeholder={`当前 ${manifest?.seed ?? "—"}`}
            className="h-8 border-[#12333a] bg-[#071118] font-mono text-[11px] text-[#d6e6e1] placeholder:text-[#3d5553]"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={!seedDraft.trim()}
            onClick={() => onRegen(seedDraft.trim())}
            className="h-8 border-[#1d4a4a] bg-[#0a2018] px-2.5 text-[10px] text-[#6fe0c6] hover:bg-[#0f3025] hover:text-[#9dfce3]"
          >
            <RefreshCw className="mr-1 h-3 w-3" /> 重建
          </Button>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {QUICK_SEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onRegen(s)}
              className="rounded border border-[#12333a] bg-[#071118] px-2 py-0.5 font-mono text-[9px] text-[#5d7a78] transition-colors hover:border-[#1d4a4a] hover:text-[#6fe0c6]"
            >
              {s}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onRegen(Math.floor(Math.random() * 4294967295))}
            className="rounded border border-[#12333a] bg-[#071118] px-2 py-0.5 font-mono text-[9px] text-[#5d7a78] transition-colors hover:border-[#1d4a4a] hover:text-[#ffbe7a]"
          >
            🎲 随机
          </button>
        </div>
      </section>

      {/* 快照 */}
      <section>
        <SectionTitle>帧内快照</SectionTitle>
        <div className="flex items-start gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onCapture}
            disabled={!connected}
            className="h-8 border-[#1d4a4a] bg-[#0a2018] px-2.5 text-[10px] text-[#6fe0c6] hover:bg-[#0f3025] hover:text-[#9dfce3]"
          >
            <Camera className="mr-1 h-3 w-3" /> CAPTURE
          </Button>
          {capture && (
            <a
              href={capture}
              download="abyssal-well.png"
              className="group relative block flex-1 overflow-hidden rounded-md border border-[#12333a]"
              title="点击下载 PNG"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capture} alt="引擎快照" className="block w-full [image-rendering:pixelated]" />
              <span className="absolute inset-0 hidden items-center justify-center bg-black/50 text-[10px] uppercase tracking-[0.2em] text-[#9dfce3] group-hover:flex">
                <Download className="mr-1 h-3 w-3" /> 下载
              </span>
            </a>
          )}
        </div>
      </section>

      {/* 协议日志 */}
      <section className="mt-auto border-t border-[#0f2a30] pt-3">
        <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.3em] text-[#4d6a68]">
          <span>协议流量 · {connected ? "已连接" : "等待握手"}</span>
          <span>{logLines.length} 条</span>
        </div>
        <div className="mt-2 max-h-32 overflow-y-auto rounded-md border border-[#12333a] bg-[#050b10] p-2 font-mono text-[9px] leading-relaxed text-[#5d8a80]">
          {logLines.length === 0 && <div className="text-[#31494b]">等待引擎消息…</div>}
          {logLines.map((l, i) => (
            <div key={`${i}-${l}`} className={i === 0 ? "text-[#9dfce3]" : undefined}>
              ◀ {l}
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
