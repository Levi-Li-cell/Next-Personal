import type { CardNavItem } from "@/components/CardNav";
import type { FeatureFlags } from "@/hooks/useFeatureFlags";

/**
 * 全站统一的顶部导航菜单（与首页一致）。
 * 三个卡片：关于 / 作品 / 互动，各自使用有区分度的渐变背景。
 */
export function buildSiteNavItems(flags: FeatureFlags): CardNavItem[] {
  return [
    {
      label: "关于",
      bgColor: "linear-gradient(135deg, #2D1B4E 0%, #6D28D9 55%, #9333EA 100%)",
      textColor: "#fff",
      links: [
        ...(flags.showAuthorPage ? [{ label: "作者主页", href: "/author" }] : []),
        { label: "简历", href: "/resume" },
      ],
    },
    {
      label: "作品",
      bgColor: "linear-gradient(135deg, #0F172A 0%, #1D4ED8 55%, #0EA5E9 100%)",
      textColor: "#fff",
      links: [
        { label: "项目", href: "/projects" },
        { label: "博客", href: "/blog" },
      ],
    },
    {
      label: "互动",
      bgColor: "linear-gradient(135deg, #14532D 0%, #047857 55%, #10B981 100%)",
      textColor: "#fff",
      links: [
        { label: "留言板", href: "/guestbook" },
        { label: "空间实验室", href: "/geo-lab" },
        ...(flags.showSnakeGame ? [{ label: "3D 贪吃蛇", href: "/snake3d" }] : []),
        ...(flags.showSponsorPage ? [{ label: "赞助", href: "/sponsor" }] : []),
      ],
    },
  ];
}