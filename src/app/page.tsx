"use client";

import dynamic from "next/dynamic";
import CardNav from "@/components/CardNav";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useScrollGuard } from "@/hooks/useScrollGuard";
import { buildSiteNavItems } from "@/lib/site-nav";
import "@/components/liwei-3d/styles.css";

const LiweiApp = dynamic(() => import("@/components/liwei-3d/LiweiApp"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0e16] text-[#f4f1ea]">
      3D 简历加载中…
    </div>
  ),
});

export default function HomePage() {
  const { flags, loading } = useFeatureFlags();
  useScrollGuard();

  return (
    <>
      <div className="liwei-3d">
        <LiweiApp adminMode={flags.enable3DTools} />
      </div>
      <CardNav
        items={buildSiteNavItems(flags)}
        ctaLabel="联系我"
        ctaHref="/guestbook"
        brandHref="/"
      />
    </>
  );
}