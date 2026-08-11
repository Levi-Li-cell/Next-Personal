"use client";

import CardNav from "@/components/CardNav";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useScrollGuard } from "@/hooks/useScrollGuard";
import { buildSiteNavItems } from "@/lib/site-nav";

/**
 * 全站统一顶部导航：与首页使用完全相同的 CardNav。
 */
export default function SiteNav() {
  const { flags } = useFeatureFlags();
  useScrollGuard();

  return (
    <CardNav
      items={buildSiteNavItems(flags)}
      ctaLabel="联系我"
      ctaHref="/guestbook"
      brandHref="/"
    />
  );
}