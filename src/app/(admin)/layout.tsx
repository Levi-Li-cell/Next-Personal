import { AdminLayout } from "@/components/admin/layout";
import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdminRequest())) {
    redirect("/signin?redirect=/admin");
  }
  return <AdminLayout>{children}</AdminLayout>;
}
