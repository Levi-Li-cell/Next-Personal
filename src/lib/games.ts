import { randomUUID } from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { interactiveComment, interactiveRating, interactiveWork } from "@/db/schema/game";
import { DEFAULT_GAME_SEEDS } from "@/lib/games-seed-data";
import type { RatingDistribution, SceneConfig, SceneType } from "@/lib/games-types";
import { nanoid } from "nanoid";

/**
 * 建表 + 自愈列（与 guestbook / blog 模块的 ensure 策略一致）。
 * 该 SQL 同时被 scripts/sync-games-tables.mjs 用于向 Supabase 主动同步。
 */
export const GAMES_SYNC_SQL = [
  `CREATE TABLE IF NOT EXISTS interactive_work (
    id text PRIMARY KEY,
    slug text NOT NULL,
    title text NOT NULL,
    tagline text,
    description text NOT NULL,
    author_name text NOT NULL DEFAULT '李伟',
    author_link text,
    tags jsonb DEFAULT '[]'::jsonb,
    cover_image text,
    cover_gradient text,
    scene_type text NOT NULL DEFAULT 'crystal-cluster',
    scene_config jsonb DEFAULT '{}'::jsonb,
    controls_hint jsonb DEFAULT '[]'::jsonb,
    status text NOT NULL DEFAULT 'published',
    view_count integer NOT NULL DEFAULT 0,
    download_count integer NOT NULL DEFAULT 0,
    comment_count integer NOT NULL DEFAULT 0,
    rating_sum integer NOT NULL DEFAULT 0,
    rating_count integer NOT NULL DEFAULT 0,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    published_at timestamp DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS interactive_work_slug_unique ON interactive_work (slug)`,
  `CREATE TABLE IF NOT EXISTS interactive_rating (
    id text PRIMARY KEY,
    work_id text NOT NULL,
    voter_key text NOT NULL,
    user_id text,
    score integer NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS interactive_rating_work_voter_unique ON interactive_rating (work_id, voter_key)`,
  `CREATE TABLE IF NOT EXISTS interactive_comment (
    id text PRIMARY KEY,
    work_id text NOT NULL,
    user_id text,
    guest_name text,
    parent_id text,
    content text NOT NULL,
    like_count integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'approved',
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS interactive_comment_work_idx ON interactive_comment (work_id)`,
  `CREATE TABLE IF NOT EXISTS interactive_comment_like (
    id text PRIMARY KEY,
    comment_id text NOT NULL,
    voter_key text NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS interactive_comment_like_unique ON interactive_comment_like (comment_id, voter_key)`,
  `DO $$ BEGIN
    ALTER TABLE interactive_rating
    ADD CONSTRAINT interactive_rating_work_id_interactive_work_id_fk
    FOREIGN KEY (work_id) REFERENCES public.interactive_work(id) ON DELETE cascade;
  EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE interactive_rating
    ADD CONSTRAINT interactive_rating_user_id_user_id_fk
    FOREIGN KEY (user_id) REFERENCES public.user(id) ON DELETE set null;
  EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE interactive_comment
    ADD CONSTRAINT interactive_comment_work_id_interactive_work_id_fk
    FOREIGN KEY (work_id) REFERENCES public.interactive_work(id) ON DELETE cascade;
  EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE interactive_comment
    ADD CONSTRAINT interactive_comment_user_id_user_id_fk
    FOREIGN KEY (user_id) REFERENCES public.user(id) ON DELETE set null;
  EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE interactive_comment
    ADD CONSTRAINT interactive_comment_parent_id_interactive_comment_id_fk
    FOREIGN KEY (parent_id) REFERENCES public.interactive_comment(id) ON DELETE cascade;
  EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN
    ALTER TABLE interactive_comment_like
    ADD CONSTRAINT interactive_comment_like_comment_id_interactive_comment_id_fk
    FOREIGN KEY (comment_id) REFERENCES public.interactive_comment(id) ON DELETE cascade;
  EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `ALTER TABLE interactive_work ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE interactive_rating ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE interactive_comment ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE interactive_comment_like ENABLE ROW LEVEL SECURITY`,
];

export async function ensureGameTables() {
  for (const statement of GAMES_SYNC_SQL) {
    await db.execute(sql.raw(statement));
  }
}

/**
 * ensure 结果的进程内缓存：DDL 建表/补列是幂等的，但 18 条语句串行执行
 * 会给每个 API 请求平添一整个 RTT 链路（远程库上即秒级延迟）。
 * 表结构在一个进程生命周期内只需保证一次；失败时清空缓存允许重试。
 */
let gamesTablesReady: Promise<void> | null = null;
export function ensureGameTablesOnce(): Promise<void> {
  gamesTablesReady ??= ensureGameTables().catch((error) => {
    gamesTablesReady = null;
    throw error;
  });
  return gamesTablesReady;
}

let gamesSeeded: Promise<void> | null = null;
/** 同 ensureGamesSeeded，但每个进程只真正查一次 count（空表才灌种子） */
export function ensureGamesSeededOnce(): Promise<void> {
  gamesSeeded ??= ensureGamesSeeded().catch((error) => {
    gamesSeeded = null;
    throw error;
  });
  return gamesSeeded;
}

/** 作品表为空时自动灌入种子（含评分明细与演示评论，保证图表与均分一致） */
export async function ensureGamesSeeded() {
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(interactiveWork);
  if (Number(countResult[0]?.count || 0) > 0) return;

  for (const seed of DEFAULT_GAME_SEEDS) {
    const ratingSum = seed.ratingDistribution.reduce((sum, count, index) => sum + count * (index + 1), 0);
    const ratingCount = seed.ratingDistribution.reduce((sum, count) => sum + count, 0);
    const workId = nanoid();

    await db.insert(interactiveWork).values({
      id: workId,
      slug: seed.slug,
      title: seed.title,
      tagline: seed.tagline,
      description: seed.description,
      authorName: seed.authorName,
      authorLink: seed.authorLink,
      tags: seed.tags,
      coverImage: null,
      coverGradient: seed.coverGradient,
      sceneType: seed.sceneType,
      sceneConfig: seed.sceneConfig as Record<string, unknown>,
      controlsHint: seed.controlsHint,
      status: "published",
      viewCount: seed.viewCount,
      downloadCount: seed.downloadCount,
      commentCount: seed.comments.reduce((sum, item) => sum + 1 + (item.replies?.length || 0), 0),
      ratingSum,
      ratingCount,
    });

    // 评分明细：分布 → 逐条 voterKey = seed:{slug}:{n}
    const ratingRows: Array<typeof interactiveRating.$inferInsert> = [];
    ([1, 2, 3, 4, 5] as const).forEach((score) => {
      const count = seed.ratingDistribution[score - 1];
      for (let i = 0; i < count; i += 1) {
        ratingRows.push({
          id: nanoid(),
          workId,
          voterKey: `seed:${seed.slug}:${score}:${i}`,
          userId: null,
          score,
        });
      }
    });
    if (ratingRows.length > 0) {
      await db.insert(interactiveRating).values(ratingRows);
    }

    // 演示评论（一层回复树）
    for (const comment of seed.comments) {
      const rootId = nanoid();
      await db.insert(interactiveComment).values({
        id: rootId,
        workId,
        userId: null,
        guestName: comment.guestName,
        parentId: null,
        content: comment.content,
        likeCount: comment.likeCount,
      });
      for (const reply of comment.replies || []) {
        await db.insert(interactiveComment).values({
          id: nanoid(),
          workId,
          userId: null,
          guestName: reply.guestName,
          parentId: rootId,
          content: reply.content,
          likeCount: reply.likeCount,
        });
      }
    }
  }
}

/** 行 → WorkDetail（API 输出格式） */
export function toWorkDetail(row: typeof interactiveWork.$inferSelect) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    author: { name: row.authorName, link: row.authorLink },
    tags: (row.tags as string[]) || [],
    coverImage: row.coverImage,
    coverGradient: row.coverGradient,
    sceneType: row.sceneType as SceneType,
    sceneConfig: (row.sceneConfig as SceneConfig) || {},
    controlsHint: (row.controlsHint as string[]) || [],
    status: row.status,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
    publishedAt: row.publishedAt?.toISOString() ?? null,
  };
}

/** 行 → WorkSummary（列表卡片） */
export function toWorkSummary(row: typeof interactiveWork.$inferSelect) {
  const ratingCount = row.ratingCount || 0;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    tags: (row.tags as string[]) || [],
    coverImage: row.coverImage,
    coverGradient: row.coverGradient,
    sceneType: row.sceneType as SceneType,
    viewCount: row.viewCount,
    downloadCount: row.downloadCount,
    commentCount: row.commentCount,
    ratingAverage: ratingCount > 0 ? Math.round((row.ratingSum / ratingCount) * 10) / 10 : 0,
    ratingCount,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

/** GROUP BY score 结果 → 完整分布（缺省补 0） */
export function buildDistribution(rows: Array<{ score: number; count: number }>): RatingDistribution {
  const distribution: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of rows) {
    if (row.score >= 1 && row.score <= 5) {
      distribution[row.score as 1 | 2 | 3 | 4 | 5] = Number(row.count);
    }
  }
  return distribution;
}

/** 汇总评分（均分 / 总数 / 分布），供详情与提交评分共用 */
export async function computeRatingSummary(workId: string, voterKey: string) {
  const [distributionRows, myRows] = await Promise.all([
    db
      .select({ score: interactiveRating.score, count: sql<number>`count(*)` })
      .from(interactiveRating)
      .where(eq(interactiveRating.workId, workId))
      .groupBy(interactiveRating.score),
    db
      .select({ score: interactiveRating.score })
      .from(interactiveRating)
      .where(and(eq(interactiveRating.workId, workId), eq(interactiveRating.voterKey, voterKey)))
      .limit(1),
  ]);

  const distribution = buildDistribution(distributionRows);
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  const sum = distributionRows.reduce((acc, row) => acc + Number(row.score) * Number(row.count), 0);

  return {
    average: total > 0 ? Math.round((sum / total) * 10) / 10 : 0,
    total,
    distribution,
    myScore: myRows.length > 0 ? myRows[0].score : null,
  };
}

/**
 * 解析投票身份：登录用户优先（user:{id}），游客使用客户端传入的 guest:{uuid}。
 * 返回的 voterKey 用于评分与评论点赞的去重。
 */
export function resolveVoterKey(
  sessionUserId: string | undefined | null,
  rawGuestKey: string | unknown,
): { voterKey: string; userId: string | null } {
  if (sessionUserId) return { voterKey: `user:${sessionUserId}`, userId: sessionUserId };
  const raw = typeof rawGuestKey === "string" ? rawGuestKey : "";
  if (/^guest:[a-zA-Z0-9-]{8,64}$/.test(raw)) return { voterKey: raw, userId: null };
  return { voterKey: `guest:${randomUUID()}`, userId: null };
}
