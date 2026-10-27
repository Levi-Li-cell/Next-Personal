/**
 * AWP/1 — Abyssal Well Protocol（宿主 ↔ 引擎适配层）
 *
 * 游戏文件（public/games/abyssal-well.html）内嵌了一个 postMessage 适配器：
 * 被 iframe 嵌入时暴露调试视图切换、渲染参数实时调节、世界种子重建、
 * 帧内同步 canvas 快照与周期遥测；直接双击打开时协议层完全静默。
 *
 * 本文件是协议的 TypeScript 侧：类型定义 + HostBridge 客户端。
 * 消息统一形如 { src: 'abyssal-host' | 'abyssal-well', proto: 1, type, ... }。
 */

export const AWP_VERSION = 1;

/** 引擎能力清单（HELLO / GET_MANIFEST 返回） */
export interface AwpManifest {
  version: string;
  views: string[];
  uniforms: AwpUniformSpec[];
  flags: string[];
  seed: number;
  world: number[];
  virtual: number[];
  fluidGrid: number[];
  maxLights: number;
}

/** 可调渲染参数描述（TUNE 表的一项） */
export interface AwpUniformSpec {
  key: string;
  /** 当前值（工厂默认值见 def，由 RESET_UNIFORM 恢复） */
  v: number;
  min: number;
  max: number;
  step: number;
  label: string;
}

/** 周期遥测（默认 ~0.28s 一条） */
export interface AwpStats {
  fps: number;
  frameMs: number;
  drawCalls: number;
  lights: number;
  maxLights: number;
  quads: number;
  seed: number;
  view: string;
  viewIndex: number;
  fluid: boolean;
  bloom: boolean;
  zone: string | null;
  cam: number[];
}

/** 引擎完整状态快照（GET_STATE / respawn 等返回） */
export interface AwpState {
  version: string;
  seed: number;
  view: string;
  viewIndex: number;
  fluid: boolean;
  fluidSupported: boolean;
  bloom: boolean;
  bloomSupported: boolean;
  floatBuffers: boolean;
  zone: string | null;
  lights: number;
  quads: number;
  cam: number[];
  player: number[];
}

export type AwpEvent =
  | { type: "hello"; manifest: AwpManifest; state: AwpState }
  | { type: "manifest"; manifest: AwpManifest }
  | { type: "state"; state: AwpState }
  | { type: "stats"; stats: AwpStats }
  | { type: "view"; ok: boolean; view: string }
  | { type: "uniform"; key: string; value: number }
  | { type: "uniforms"; uniforms: AwpUniformSpec[] }
  | { type: "flag"; key: string; value: boolean }
  | { type: "seeded"; seed: number; state: AwpState }
  | { type: "capture"; requestId: string | null; dataURL: string; width: number; height: number }
  | { type: "error"; message: string }
  | { type: "rafFallback"; on: boolean }
  | { type: "pong"; t: number; version: string }
  | { type: "nack"; reason: string };

type AwpCommand =
  | "GET_MANIFEST"
  | "GET_STATE"
  | "SET_VIEW"
  | "SET_UNIFORM"
  | "RESET_UNIFORM"
  | "SET_FLAG"
  | "REGEN"
  | "CAPTURE"
  | "RESPAWN"
  | "PING";

/**
 * 挂在 iframe.contentWindow 上的协议客户端。
 * 用法：
 *   const bridge = new AbyssalHostBridge();
 *   useEffect(() => {
 *     bridge.attach(frameRef.current!.contentWindow!);
 *     const off = bridge.on(setEvent);
 *     return () => { off(); bridge.detach(); };
 *   }, []);
 */
export class AbyssalHostBridge {
  private target: Window | null = null;
  private listeners = new Set<(e: AwpEvent) => void>();
  private readonly handler = (ev: MessageEvent) => {
    const d = ev.data as Record<string, unknown> | null;
    if (!d || typeof d !== "object") return;
    if (d.src !== "abyssal-well" || d.proto !== AWP_VERSION) return;
    const e = this.parse(d);
    if (e) this.listeners.forEach((fn) => fn(e));
  };

  /** 开始监听引擎消息并记住发送目标；重复 attach 会先释放旧监听 */
  attach(target: Window) {
    this.detach();
    this.target = target;
    window.addEventListener("message", this.handler);
  }

  detach() {
    window.removeEventListener("message", this.handler);
    this.target = null;
  }

  on(fn: (e: AwpEvent) => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private send(type: AwpCommand, payload?: Record<string, unknown>) {
    if (!this.target) return;
    this.target.postMessage({ src: "abyssal-host", proto: AWP_VERSION, type, ...payload }, "*");
  }

  private parse(d: Record<string, unknown>): AwpEvent | null {
    const type = d.type;
    switch (type) {
      case "HELLO":
        return { type: "hello", manifest: d.manifest as AwpManifest, state: d.state as AwpState };
      case "MANIFEST":
        return { type: "manifest", manifest: d.manifest as AwpManifest };
      case "STATE":
        return { type: "state", state: d.state as AwpState };
      case "STATS":
        return { type: "stats", stats: d as unknown as AwpStats };
      case "VIEW":
        return { type: "view", ok: !!d.ok, view: String(d.view) };
      case "UNIFORM":
        return { type: "uniform", key: String(d.key), value: Number(d.value) };
      case "UNIFORMS":
        return { type: "uniforms", uniforms: d.uniforms as AwpUniformSpec[] };
      case "FLAG":
        return { type: "flag", key: String(d.key), value: !!d.value };
      case "SEEDED":
        return { type: "seeded", seed: Number(d.seed), state: d.state as AwpState };
      case "CAPTURE":
        return {
          type: "capture",
          requestId: (d.requestId as string | null) ?? null,
          dataURL: String(d.dataURL),
          width: Number(d.width),
          height: Number(d.height),
        };
      case "ERROR":
        return { type: "error", message: String(d.message ?? "unknown error") };
      case "RAF_FALLBACK":
        return { type: "rafFallback", on: !!d.on };
      case "PONG":
        return { type: "pong", t: Number(d.t), version: String(d.version) };
      case "NACK":
        return { type: "nack", reason: String(d.reason ?? "") };
      default:
        return null;
    }
  }

  setView(view: string | number) {
    this.send("SET_VIEW", { view });
  }
  setUniform(key: string, value: number) {
    this.send("SET_UNIFORM", { key, value });
  }
  resetUniform(key?: string) {
    this.send("RESET_UNIFORM", key ? { key } : {});
  }
  setFlag(key: string, value: boolean) {
    this.send("SET_FLAG", { key, value });
  }
  regen(seed: string | number) {
    this.send("REGEN", { seed });
  }
  capture(requestId?: string) {
    this.send("CAPTURE", { requestId: requestId ?? `cap-${Date.now()}` });
  }
  respawn() {
    this.send("RESPAWN");
  }
  getManifest() {
    this.send("GET_MANIFEST");
  }
  getState() {
    this.send("GET_STATE");
  }
  ping() {
    this.send("PING", { t: Date.now() });
  }
}
