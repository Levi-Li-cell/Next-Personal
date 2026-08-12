import { redirect } from "next/navigation";
import { getFeatureFlags } from "@/lib/feature-flags";
import { isAdminRequest } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export default async function AuthorRouteGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  const flags = await getFeatureFlags();
  if (!flags.showAuthorPage) redirect("/");
  if (!flags.allowPublicAuthorPage && !(await isAdminRequest())) redirect("/");
  return children;
}
