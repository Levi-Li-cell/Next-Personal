import { redirect } from "next/navigation";
import { getFeatureFlags } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export default async function AuthorRouteGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  const flags = await getFeatureFlags();
  if (!flags.showAuthorPage) redirect("/");
  return children;
}
