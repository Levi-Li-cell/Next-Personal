"use client";

import { Bell, Search, User, LogOut, Settings } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function AdminHeader() {
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email?: string; image?: string } | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      localStorage.removeItem("user");
      router.push("/signin");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
      <SidebarTrigger className="-ml-1" />

      <div className="flex-1 flex items-center gap-4">
        {/* 搜索框 */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索..."
            className="pl-8 w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* 通知 */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
            3
          </span>
        </Button>

        {/* 用户菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.image} alt={user?.name || "User"} />
                <AvatarFallback>
                  {user?.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline-flex">{user?.name || "用户"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || "用户"}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || ""}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/admin/settings/profile")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>个人设置</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
