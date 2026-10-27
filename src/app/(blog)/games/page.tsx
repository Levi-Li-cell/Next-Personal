"use client";

import { motion } from "motion/react";
import { ArrowRight, Download, Eye, Flame, Gamepad2, Gem, MessageSquare, Orbit, Shell, Waves } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import StarRating from "@/components/games/StarRating";
import type { SceneType, WorkSummary } from "@/lib/games-types";

interface GamesResponse {
  success: boolean;
  data: WorkSummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

type SortKey = "latest" | "popular" | "rating";

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "latest", label: "最新" },
  { key: "popular", label: "最热" },
  { key: "rating", label: "评分" },
];

/** 不同场景类型的封面图标与默认渐变兜底 */
const SCENE_ICONS: Record<SceneType, typeof Gem> = {
  "crystal-cluster": Gem,
  "wave-field": Waves,
  "torus-knot": Shell,
  "orbiting-spheres": Orbit,
  "abyssal-well": Flame,
};

/** 由 slug 派生封面高度，制造瀑布流的高低差 */
const COVER_HEIGHTS = ["h-44", "h-52", "h-60", "h-48"];

function coverHeight(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) hash = (hash * 31 + slug.charCodeAt(i)) % 997;
  return COVER_HEIGHTS[hash % COVER_HEIGHTS.length];
}

function StatItem({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1" title={label}>
      {icon}
      {value}
    </span>
  );
}

function WorkCover({ work }: { work: WorkSummary }) {
  const Icon = SCENE_ICONS[work.sceneType] ?? Gamepad2;
  if (work.coverImage) {
    return (
      <div className="overflow-hidden border-b border-ink/14">
        <img
          src={work.coverImage}
          alt={work.title}
          loading="lazy"
          decoding="async"
          className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }
  return (
    <div
      className={`relative ${coverHeight(work.slug)} w-full overflow-hidden`}
      style={{ background: work.coverGradient || "linear-gradient(140deg, #2b3a55 0%, #a8c0e6 100%)" }}
    >
      {/* 细网格纹理，呼应全站 site-shell 背景 */}
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon
          className="h-12 w-12 text-white/70 transition-transform duration-500 group-hover:scale-110 group-hover:text-white"
          strokeWidth={1.2}
          aria-hidden="true"
        />
      </div>
      {work.ratingCount > 0 && (
        <span className="absolute bottom-2.5 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-[11px] text-white/90 backdrop-blur-sm">
          <StarRating value={work.ratingAverage} size={11} />
          {work.ratingAverage.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export default function GamesPage() {
  const [works, setWorks] = useState<WorkSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("latest");

  useEffect(() => {
    let cancelled = false;
    async function fetchWorks() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ sort, limit: "30" });
        if (activeTag) params.set("tag", activeTag);
        const response = await fetch(`/api/games?${params.toString()}`);
        const result: GamesResponse = await response.json();
        if (cancelled) return;
        if (!result.success) {
          setError("获取作品列表失败");
          return;
        }
        setWorks(result.data);
      } catch (err) {
        console.error("Failed to fetch games:", err);
        if (!cancelled) setError("网络错误，请稍后重试");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchWorks();
    return () => {
      cancelled = true;
    };
  }, [activeTag, sort]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    works.forEach((work) => work.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags);
  }, [works]);

  return (
    <div className="container mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="mb-6 rounded-[1.75rem] border border-ink/14 bg-[linear-gradient(135deg,rgba(111,144,111,0.14),rgba(255,255,255,0.04))] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-sage">Interactive Playground</p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/68">
            这里收录可实时运行的 WebGL 交互小品。每一件作品都能在浏览器里直接把玩：拖拽旋转、切换渲染模式，顺手打个分、留句话。
          </p>
        </div>
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">
          <span className="bg-gradient-to-r from-accent via-peach to-ink bg-clip-text text-transparent">互动小游戏</span>
        </h1>
        <p className="text-lg text-ink/60">AI 与程序化生成的交互作品展示，瀑布流缓慢更新中。</p>
      </motion.div>

      {/* 标签 + 排序工具条 */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTag("")}
          className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
            activeTag === "" ? "border-accent/50 bg-accent/14 text-accent" : "border-ink/14 text-ink/60 hover:border-ink/30 hover:text-ink"
          }`}
        >
          全部
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveTag(activeTag === tag ? "" : tag)}
            className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
              activeTag === tag ? "border-accent/50 bg-accent/14 text-accent" : "border-ink/14 text-ink/60 hover:border-ink/30 hover:text-ink"
            }`}
          >
            {tag}
          </button>
        ))}
        <div className="ml-auto flex overflow-hidden rounded-full border border-ink/14">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setSort(option.key)}
              className={`px-3.5 py-1.5 text-xs transition-colors ${
                sort === option.key ? "bg-ink text-white" : "text-ink/60 hover:text-ink"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="mb-6 break-inside-avoid overflow-hidden rounded-2xl border border-ink/14 bg-ink/5">
              <div className={`${COVER_HEIGHTS[index % COVER_HEIGHTS.length]} w-full animate-pulse bg-ink/10`} />
              <div className="space-y-3 p-5">
                <div className="h-5 w-2/3 animate-pulse rounded bg-ink/10" />
                <div className="h-4 w-full animate-pulse rounded bg-ink/10" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-ink/10" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/20 p-6 text-center">
          <p className="text-red-300">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 rounded-md bg-accent px-4 py-2 text-black">
            重试
          </button>
        </div>
      ) : works.length === 0 ? (
        <div className="py-20 text-center">
          <Gamepad2 className="mx-auto h-10 w-10 text-ink/30" />
          <p className="mt-4 text-ink/60">{activeTag ? "该标签下暂无作品" : "暂无作品"}</p>
        </div>
      ) : (
        <div className="columns-1 gap-6 [column-fill:_balance] md:columns-2 lg:columns-3">
          {works.map((work) => (
            <Link key={work.id} href={`/games/${work.slug}`} className="mb-6 block break-inside-avoid">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "80px" }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -5 }}
                className="group overflow-hidden rounded-2xl border border-ink/14 bg-ink/5 backdrop-blur-sm transition-colors hover:border-accent/40"
              >
                <WorkCover work={work} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-accent">
                      {work.title}
                    </h2>
                    {work.ratingCount > 0 && (
                      <span className="mt-0.5 shrink-0 text-xs text-ink/50">{work.ratingAverage.toFixed(1)} 分</span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm leading-6 text-ink/60">{work.tagline}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {work.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded-full bg-accent/14 px-2.5 py-0.5 text-[11px] text-accent">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-4 border-t border-ink/10 pt-3 text-xs text-ink/50">
                    <StatItem icon={<Eye className="h-3.5 w-3.5" />} value={work.viewCount} label="浏览" />
                    <StatItem icon={<Download className="h-3.5 w-3.5" />} value={work.downloadCount} label="下载" />
                    <StatItem icon={<MessageSquare className="h-3.5 w-3.5" />} value={work.commentCount} label="讨论" />
                    <ArrowRight className="ml-auto h-4 w-4 text-accent opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
