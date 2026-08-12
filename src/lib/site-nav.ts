import type { CardNavItem } from "@/components/CardNav";
import type { FeatureFlags } from "@/hooks/useFeatureFlags";

/**
 * 全站统一的顶部导航菜单（与首页一致）。
 * 三个卡片：关于 / 作品 / 互动，各自使用有区分度的渐变背景。
 */
export function buildSiteNavItems(flags: FeatureFlags, canAccessAuthorPage = false): CardNavItem[] {
  return [
    {
      label: "关于",
      bgColor: "linear-gradient(135deg, #f4e5cf 0%, #e9bd7d 100%)",
      textColor: "#1b2024",
      links: [
        ...(canAccessAuthorPage ? [{ label: "作者主页", href: "/author" }] : []),
        { label: "简历", href: "/resume" },
      ],
    },
    {
      label: "作品",
      bgColor: "linear-gradient(135deg, #dce8f1 0%, #a9cde0 100%)",
      textColor: "#1b2024",
      links: [
        { label: "项目", href: "/projects" },
        { label: "博客", href: "/blog" },
      ],
    },
    {
      label: "互动",
      bgColor: "linear-gradient(135deg, #dceadd 0%, #a6c8a9 100%)",
      textColor: "#1b2024",
      links: [
        { label: "留言板", href: "/guestbook" },
        { label: "空间实验室", href: "/geo-lab" },
        ...(flags.showSnakeGame ? [{ label: "3D 贪吃蛇", href: "/snake3d" }] : []),
        ...(flags.showSponsorPage ? [{ label: "赞助", href: "/sponsor" }] : []),
      ],
    },
  ];
}
