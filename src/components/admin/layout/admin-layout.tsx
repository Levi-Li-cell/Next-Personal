"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import { AdminBreadcrumb } from "./admin-breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth/client";
import { RealtimeAdminNotification } from "@/components/admin/RealtimeAdminNotification";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      // 如果 session 还在加载，等待
      if (isPending) return;

      // 如果没有登录，跳转到登录页
      if (!session?.user) {
        router.push("/signin?redirect=/admin");
        return;
      }

      const user = session.user;

      // 保存用户信息到 localStorage（供其他组件使用）
      localStorage.setItem("user", JSON.stringify(user));

      try {
        // 调用 API 验证管理员权限
        const response = await fetch("/api/check-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
          }),
        });

        const data = await response.json();

        if (!data.isAdmin) {
          // 不是管理员，跳转到首页
          router.push("/");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Admin check failed:", error);
        router.push("/signin?redirect=/admin");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [session, isPending, router]);

  // 显示加载状态
  if (isPending || isLoading) {
    return (
      <div className="flex h-screen w-full">
        <div className="w-64 border-r bg-muted/30 p-4">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-12 w-full mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // 不是管理员
  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <RealtimeAdminNotification />
        <AdminHeader />
        <div className="flex flex-col">
          <div className="border-b px-6 py-4">
            <AdminBreadcrumb />
          </div>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
