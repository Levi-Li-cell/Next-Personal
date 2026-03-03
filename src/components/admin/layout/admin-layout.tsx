"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import { AdminBreadcrumb } from "./admin-breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // 从 localStorage 获取用户信息
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          router.push("/signin");
          return;
        }

        const user = JSON.parse(userStr);

        // 调用 API 验证管理员权限
        const response = await fetch("/api/check-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, username: user.username || user.name }),
        });

        const data = await response.json();

        if (!data.isAdmin) {
          router.push("/");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Admin check failed:", error);
        router.push("/signin");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  if (isLoading) {
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

  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
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
