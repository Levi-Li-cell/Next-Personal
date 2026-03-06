"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderKanban,
  MessageSquare,
  NotebookPen,
  Bell,
  Monitor,
  Settings,
  ChevronUp,
  ChevronRight,
  UserCircle,
  Megaphone,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

type MenuItem = {
  title: string;
  url?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: Array<{ title: string; url: string }>;
};

const menuItems: MenuItem[] = [
  {
    title: "仪表盘",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "作者管理",
    url: "/admin/author",
    icon: UserCircle,
  },
  {
    title: "用户管理",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "博客管理",
    url: "/admin/blog",
    icon: FileText,
  },
  {
    title: "公告管理",
    url: "/admin/announcements",
    icon: Megaphone,
  },
  {
    title: "项目管理",
    url: "/admin/projects",
    icon: FolderKanban,
  },
  {
    title: "评论管理",
    url: "/admin/comments",
    icon: MessageSquare,
  },
  {
    title: "留言板管理",
    url: "/admin/guestbook",
    icon: NotebookPen,
  },
  {
    title: "通知中心",
    url: "/admin/notifications",
    icon: Bell,
  },
  {
    title: "可视化大屏",
    url: "/admin/visual",
    icon: Monitor,
  },
  {
    title: "系统设置",
    icon: Settings,
    children: [
      { title: "基础设置", url: "/admin/settings" },
      { title: "通知邮箱", url: "/admin/settings/notify" },
      { title: "个人资料", url: "/admin/settings/profile" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name?: string; email?: string; image?: string } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }

    if (
      pathname === "/admin/settings" ||
      pathname.startsWith("/admin/settings/")
    ) {
      setSettingsOpen(true);
    }
  }, [pathname]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <LayoutDashboard className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">后台管理</span>
                  <span className="truncate text-xs text-muted-foreground">Admin Panel</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>导航菜单</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.children && item.children.length > 0 ? (
                    <>
                      <SidebarMenuButton
                        isActive={item.children.some((child) => pathname === child.url || pathname.startsWith(child.url + "/"))}
                        tooltip={item.title}
                        onClick={() => setSettingsOpen((v) => !v)}
                      >
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                        <ChevronRight className={`ml-auto size-4 transition-transform ${settingsOpen ? "rotate-90" : ""}`} />
                      </SidebarMenuButton>
                      {settingsOpen ? (
                        <SidebarMenuSub>
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.url}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === child.url || pathname.startsWith(child.url + "/")}
                              >
                                <Link href={child.url}>
                                  <span>{child.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      ) : null}
                    </>
                  ) : item.url ? (
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url || pathname.startsWith(item.url + "/")}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.image} alt={user?.name || "User"} />
                    <AvatarFallback className="rounded-lg">
                      {user?.name?.charAt(0)?.toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name || "管理员"}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email || "admin@example.com"}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuItem>
                  <Settings className="mr-2 size-4" />
                  设置
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
