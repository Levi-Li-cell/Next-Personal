"use client";

import { motion } from "motion/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ChevronDown, ChevronUp, Download, Expand, Eye, Heart, Loader2, MessageSquare, Minimize } from "lucide-react";
import WorkCanvas, { type WorkCanvasHandle } from "@/components/games/WorkCanvas";
import AbyssalWell, { type AbyssalWellHandle } from "@/components/abyssal/AbyssalWell";
import StarRating from "@/components/games/StarRating";
import GameComments from "@/components/games/GameComments";
import { getVisitorVoterKey } from "@/lib/games-client";
import type { InteractionStats, RatingDistribution, WorkDetail } from "@/lib/games-types";

interface DetailResponse {
  success: boolean;
  data?: {
    work: WorkDetail;
    stats: InteractionStats;
  };
  error?: string;
}

interface RatingResponse {
  success: boolean;
  data?: { rating: InteractionStats["rating"] };
  error?: string;
}

interface MetricsResponse {
  success: boolean;
  data?: { viewCount: number; package?: Record<string, unknown> };
  error?: string;
}

/** 场景类型的中文名（侧边栏创作者行展示用） */
const SCENE_TYPE_LABELS: Record<string, string> = {
  "crystal-cluster": "晶体簇",
  "wave-field": "波场",
  "torus-knot": "环面纽结",
  "orbiting-spheres": "轨道球",
  "abyssal-well": "原生 WebGL2 引擎",
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-ink/14 bg-ink/5 p-6 backdrop-blur-sm ${className}`}>{children}</div>
  );
}

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [work, setWork] = useState<WorkDetail | null>(null);
  const [stats, setStats] = useState<InteractionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [likeSubmitting, setLikeSubmitting] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const isLongDescription = (work?.description?.length ?? 0) > 320 || (work?.description?.split(/\n+/).filter(Boolean).length ?? 0) > 6;
  const [voterKey, setVoterKey] = useState("guest:ssr");
  const gameRef = useRef<AbyssalWellHandle | null>(null);
  const workCanvasRef = useRef<WorkCanvasHandle | null>(null);
  const [isGameFullscreen, setIsGameFullscreen] = useState(false);
  const handleGameFullscreenChange = useCallback((active: boolean) => setIsGameFullscreen(active), []);

  /** 统一的全屏切换：根据场景类型调用对应组件的 toggleFullscreen */
  const toggleFullscreen = useCallback(() => {
    if (work?.sceneType === "abyssal-well") {
      gameRef.current?.toggleFullscreen();
    } else {
      workCanvasRef.current?.toggleFullscreen();
    }
  }, [work?.sceneType]);

  useEffect(() => {
    setVoterKey(getVisitorVoterKey());
  }, []);

  useEffect(() => {
    if (voterKey === "guest:ssr") return;
    let cancelled = false;
    async function fetchDetail() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/games/${id}?voter=${encodeURIComponent(voterKey)}`);
        const result: DetailResponse = await response.json();
        if (cancelled) return;
        if (!result.success || !result.data) {
          setError(result.error || "作品不存在");
          return;
        }
        setWork(result.data.work);
        setStats(result.data.stats);
      } catch (err) {
        console.error("获取作品详情失败:", err);
        if (!cancelled) setError("网络错误，请稍后重试");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [id, voterKey]);

  /** 打分：服务端返回最新聚合（均分/总数/分布/我的分），一次 setStats 联动统计卡与评分图 */
  const handleRate = async (score: number) => {
    if (!work || ratingSubmitting) return;
    setRatingSubmitting(true);
    try {
      const response = await fetch(`/api/games/${work.id}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, voterKey }),
      });
      const result: RatingResponse = await response.json();
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || "评分失败");
      }
      setStats((prev) => (prev ? { ...prev, rating: result.data!.rating } : prev));
      toast.success(result.data.rating.myScore === score ? `已打 ${score} 星` : `评分已更新为 ${score} 星`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "评分失败，请稍后重试");
    } finally {
      setRatingSubmitting(false);
    }
  };

  /** 下载工程包：仅导出场景参数 JSON，不驱动任何统计（统计口径已改为“喜欢”） */
  const handleDownload = async () => {
    if (!work || downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(`/api/games/${work.id}/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "download" }),
      });
      const result: MetricsResponse = await response.json();
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || "下载失败");
      }
      if (result.data.package) {
        const blob = new Blob([JSON.stringify(result.data.package, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${work.slug}-scene.json`;
        anchor.click();
        URL.revokeObjectURL(url);
      }
      toast.success("工程包已开始下载");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "下载失败，请稍后重试");
    } finally {
      setDownloading(false);
    }
  };

  /** 喜欢/取消喜欢：乐观切换心形与计数，失败回滚 */
  const handleToggleLike = async () => {
    if (!work || !stats || likeSubmitting) return;
    setLikeSubmitting(true);
    const prev = { myLike: stats.myLike, likeCount: stats.likeCount };
    setStats({ ...stats, myLike: !prev.myLike, likeCount: Math.max(0, prev.likeCount + (prev.myLike ? -1 : 1)) });
    try {
      const response = await fetch(`/api/games/${work.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterKey }),
      });
      const result = await response.json();
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || "操作失败");
      }
      setStats((current) => (current ? { ...current, myLike: result.data.liked, likeCount: result.data.likeCount } : current));
    } catch (err) {
      setStats((current) => (current ? { ...current, ...prev } : current));
      toast.error(err instanceof Error ? err.message : "操作失败，请稍后重试");
    } finally {
      setLikeSubmitting(false);
    }
  };

  /** 评论发表成功 → 联动“讨论”统计卡 */
  const handleCommentCountChange = (delta: number) => {
    setStats((prev) => (prev ? { ...prev, commentCount: prev.commentCount + delta } : prev));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center gap-2 text-sm text-ink/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在加载作品…
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-[420px] animate-pulse rounded-2xl bg-ink/10 md:h-[540px]" />
          <div className="space-y-5">
            <div className="h-44 animate-pulse rounded-2xl bg-ink/10" />
            <div className="h-28 animate-pulse rounded-2xl bg-ink/10" />
            <div className="h-52 animate-pulse rounded-2xl bg-ink/10" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !work || !stats) {
    return (
      <div className="container mx-auto px-6 py-24 text-center">
        <p className="text-lg text-ink/60">{error || "作品不存在"}</p>
        <Link href="/games" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm text-white">
          <ArrowLeft className="h-4 w-4" />
          返回互动小游戏
        </Link>
      </div>
    );
  }

  const { rating } = stats;

  return (
    <div className="container mx-auto px-6 py-12">
      {/* 返回行：左侧返回链接，右侧全屏切换——按钮固定在返回行，不悬浮在游戏画面内 */}
      <div className="flex items-center justify-between gap-3">
        <Link href="/games" className="inline-flex items-center gap-2 text-sm text-ink/55 transition-colors hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          返回互动小游戏
        </Link>
        <button
          type="button"
          onClick={toggleFullscreen}
          title={isGameFullscreen ? "退出全屏 (Esc)" : "全屏"}
          className="inline-flex items-center gap-2 rounded-lg border border-ink/14 bg-ink/5 px-3 py-1.5 text-xs text-ink/60 transition-colors hover:border-accent/40 hover:text-accent"
        >
          {isGameFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Expand className="h-3.5 w-3.5" />}
          {isGameFullscreen ? "退出全屏" : "全屏"}
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
        {/* 上排：左 = WebGL 交互画布，右 = 侧边栏 */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {work.sceneType === "abyssal-well" ? (
            <div className="overflow-hidden rounded-2xl border border-ink/14 bg-[#03060a]">
              <AbyssalWell ref={gameRef} variant="embedded" onFullscreenChange={handleGameFullscreenChange} />
            </div>
          ) : (
            <div className="h-[420px] overflow-hidden rounded-2xl border border-ink/14 md:h-[540px]">
              <WorkCanvas
                ref={workCanvasRef}
                sceneType={work.sceneType}
                sceneConfig={work.sceneConfig}
                controlsHint={work.controlsHint}
                title={work.title}
                onFullscreenChange={handleGameFullscreenChange}
              />
            </div>
          )}

          <aside className="space-y-5">
            {/* 作品信息 */}
            <Card>
              <h1 className="text-2xl font-bold leading-tight text-ink">{work.title}</h1>
              <p className="mt-2 text-sm leading-6 text-ink/60">{work.tagline}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {work.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-accent/14 px-2.5 py-0.5 text-[11px] text-accent">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-3 border-t border-ink/10 pt-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage/20 text-base font-medium text-sage">
                  {work.author.name.slice(0, 1)}
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{work.author.name}</p>
                  <p className="text-xs text-ink/45">创作者 · {SCENE_TYPE_LABELS[work.sceneType] ?? work.sceneType}</p>
                </div>
              </div>
            </Card>

            {/* 数据统计 */}
            <Card>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink/55">数据统计</h2>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-white/60 py-3">
                  <Eye className="mx-auto h-4 w-4 text-ink/45" aria-hidden="true" />
                  <p className="mt-1.5 text-lg font-bold tabular-nums text-ink">{stats.viewCount}</p>
                  <p className="text-[11px] text-ink/45">浏览</p>
                </div>
                {/* 喜欢：可点击的心形开关，按访客去重 */}
                <button
                  type="button"
                  onClick={handleToggleLike}
                  disabled={likeSubmitting}
                  aria-pressed={stats.myLike}
                  aria-label={stats.myLike ? "取消喜欢" : "喜欢"}
                  className={`rounded-xl bg-white/60 py-3 transition-colors hover:bg-peach/10 disabled:opacity-70 ${
                    stats.myLike ? "text-peach" : "text-ink"
                  }`}
                >
                  {likeSubmitting ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Heart className={`mx-auto h-4 w-4 transition-colors ${stats.myLike ? "text-peach" : "text-ink/45"}`} fill={stats.myLike ? "currentColor" : "none"} aria-hidden="true" />
                  )}
                  <p className="mt-1.5 text-lg font-bold tabular-nums">{stats.likeCount}</p>
                  <p className={`text-[11px] ${stats.myLike ? "text-peach" : "text-ink/45"}`}>{stats.myLike ? "已喜欢" : "喜欢"}</p>
                </button>
                <div className="rounded-xl bg-white/60 py-3">
                  <MessageSquare className="mx-auto h-4 w-4 text-ink/45" aria-hidden="true" />
                  <p className="mt-1.5 text-lg font-bold tabular-nums text-ink">{stats.commentCount}</p>
                  <p className="text-[11px] text-ink/45">讨论</p>
                </div>
              </div>
              {work.sceneType !== "abyssal-well" && (
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  下载场景工程包
                </button>
              )}
            </Card>

            {/* 评分系统 */}
            <Card>
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-ink/55">作品评分</h2>
                <p className="text-2xl font-bold text-accent">
                  {rating.average.toFixed(1)}
                  <span className="ml-1 text-xs font-normal text-ink/45">/ 5</span>
                </p>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <StarRating
                  interactive
                  value={rating.myScore ?? 0}
                  onRate={handleRate}
                  disabled={ratingSubmitting}
                  size={24}
                />
                {ratingSubmitting && <Loader2 className="h-4 w-4 animate-spin text-ink/40" />}
              </div>
              <p className="mt-2 text-xs text-ink/50">
                {rating.myScore ? `你打了 ${rating.myScore} 星，点击可修改` : "点击星星为作品打分"} · 共 {rating.total} 人参与
              </p>

              {/* 1-5 星分布柱状图（5 → 1） */}
              <div className="mt-4 space-y-1.5">
                {([5, 4, 3, 2, 1] as Array<keyof RatingDistribution>).map((score) => {
                  const count = rating.distribution[score];
                  const percent = rating.total > 0 ? Math.round((count / rating.total) * 100) : 0;
                  return (
                    <div key={score} className="flex items-center gap-2.5 text-xs">
                      <span className="w-7 shrink-0 text-ink/55">{score} 星</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
                        <div
                          className="h-full rounded-full bg-accent transition-[width] duration-500"
                          style={{ width: `${percent}%` }}
                          role="progressbar"
                          aria-valuenow={percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${score} 星占比 ${percent}%`}
                        />
                      </div>
                      <span className="w-9 shrink-0 text-right tabular-nums text-ink/45">{count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </aside>
        </div>

          {/* 下排：左 = 作品描述，右 = 评论区 */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-ink/55">作品描述</h2>
                <span className="text-xs text-ink/45">{work.description.length} 字</span>
              </div>
              <div className="relative mt-4">
                <div
                  className={`space-y-3.5 overflow-hidden transition-[max-height] duration-500 ${
                    descExpanded ? "max-h-[2400px]" : "max-h-56"
                  }`}
                >
                  {work.description.split(/\n+/).filter(Boolean).map((paragraph, index) => (
                    <p key={index} className="text-sm leading-7 text-ink/75">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {!descExpanded && isLongDescription && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#f7f4ec] to-transparent" />
                )}
              </div>
              {isLongDescription && (
                <button
                  type="button"
                  onClick={() => setDescExpanded((value) => !value)}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-accent transition-colors hover:text-accent/80"
                  aria-expanded={descExpanded}
                >
                  {descExpanded ? (
                    <>
                      收起描述
                      <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      展开全文
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </>
                  )}
                </button>
              )}
            </Card>

          <Card className="flex min-h-[320px] flex-col">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink/55">评论区</h2>
              <span className="text-xs text-ink/45">{stats.commentCount} 条讨论</span>
            </div>
            <div className="mt-4 min-h-0 flex-1">
              <GameComments workId={work.id} onCommentCountChange={handleCommentCountChange} />
            </div>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
