import { redirect } from "next/navigation";
import { getFeatureFlags } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

/**
 * 互动小游戏前台路由守卫：
 * 后台“前台显隐”开关（showInteractiveGames）关闭时，/games 一律重定向回首页，
 * 与导航入口的隐藏保持一致。
 */
export default async function GamesRouteGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  const flags = await getFeatureFlags();
  if (!flags.showInteractiveGames) redirect("/");
  return children;
}
