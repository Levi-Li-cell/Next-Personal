"use client";

import { useMemo } from "react";
import CardNav from "@/components/CardNav";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useScrollGuard } from "@/hooks/useScrollGuard";
import { buildSiteNavItems } from "@/lib/site-nav";
import { useSession } from "@/lib/auth/client";

/**
 * 全站统一顶部导航：与首页使用完全相同的 CardNav。
 */
export default function SiteNav() {
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
    <CardNav
      items={navItems}
      ctaLabel="联系我"
      ctaHref="/guestbook"
      brandHref="/"
    />
  );
}
