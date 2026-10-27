"use client";

import { motion } from "motion/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Download, Eye, Loader2, MessageSquare } from "lucide-react";
import WorkCanvas from "@/components/games/WorkCanvas";
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
  data?: { viewCount: number; downloadCount: number; package?: Record<string, unknown> };
  error?: string;
}

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
  const [voterKey, setVoterKey] = useState("guest:ssr");

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

  /** 下载工程包：计数 +1 后把场景参数保存为 JSON */
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
      setStats((prev) => (prev ? { ...prev, downloadCount: result.data!.downloadCount } : prev));
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
      <Link href="/games" className="inline-flex items-center gap-2 text-sm text-ink/55 transition-colors hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        返回互动小游戏
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
        {/* 上排：左 = WebGL 交互画布，右 = 侧边栏 */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-[420px] overflow-hidden rounded-2xl border border-ink/14 md:h-[540px]">
            <WorkCanvas
              sceneType={work.sceneType}
              sceneConfig={work.sceneConfig}
              controlsHint={work.controlsHint}
              title={work.title}
            />
          </div>

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
                  <p className="text-xs text-ink/45">创作者 · {work.sceneType}</p>
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
                <div className="rounded-xl bg-white/60 py-3">
                  <Download className="mx-auto h-4 w-4 text-ink/45" aria-hidden="true" />
                  <p className="mt-1.5 text-lg font-bold tabular-nums text-ink">{stats.downloadCount}</p>
                  <p className="text-[11px] text-ink/45">下载</p>
                </div>
                <div className="rounded-xl bg-white/60 py-3">
                  <MessageSquare className="mx-auto h-4 w-4 text-ink/45" aria-hidden="true" />
                  <p className="mt-1.5 text-lg font-bold tabular-nums text-ink">{stats.commentCount}</p>
                  <p className="text-[11px] text-ink/45">讨论</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                下载场景工程包
              </button>
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
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink/55">作品描述</h2>
            <div className="mt-4 space-y-4">
              {work.description.split(/\n+/).filter(Boolean).map((paragraph, index) => (
                <p key={index} className="text-sm leading-7 text-ink/75">
                  {paragraph}
                </p>
              ))}
            </div>
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
