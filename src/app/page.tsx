"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import CardNav from "@/components/CardNav";
import GameEntry from "@/components/liwei-3d/ui/GameEntry";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useScrollGuard } from "@/hooks/useScrollGuard";
import { buildSiteNavItems } from "@/lib/site-nav";
import { useSession } from "@/lib/auth/client";
import "@/components/liwei-3d/styles.css";

const LiweiApp = dynamic(() => import("@/components/liwei-3d/LiweiApp"), {
  ssr: false,
  loading: () => (
    <div
      className="flex min-h-screen items-center justify-center text-[#1b2024]"
      style={{ background: "linear-gradient(180deg, #6f906f 0%, #dbd3b5 100%)" }}
    >
      3D 简历加载中…
    </div>
  ),
});

export default function HomePage() {
  const { flags } = useFeatureFlags();
  const { data: session } = useSession();
  useScrollGuard();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role?.toLowerCase() === "admin";
  const canAccessAuthorPage = flags.showAuthorPage && (flags.allowPublicAuthorPage || isAdmin);
  // 稳定 items 引用：内联构建会让 CardNav 的 GSAP effect 每次渲染都重建并折叠导航
  const navItems = useMemo(
    () => buildSiteNavItems(flags, canAccessAuthorPage),
    [flags, canAccessAuthorPage],
  );

  return (
    <>
      <div className="liwei-3d">
        <LiweiApp adminMode={flags.enable3DTools && isAdmin} />
        {/* 互动小游戏快捷入口：跟随开关，与顶部导航的游戏项保持一致 */}
        {flags.showInteractiveGames && <GameEntry />}
      </div>
      <CardNav
        items={navItems}
        ctaLabel="联系我"
        ctaHref="/guestbook"
        brandHref="/"
      />
    </>
  );
}
