"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bot,
  ChevronRight,
  ChevronUp,
  FileText,
  FolderKanban,
  Gamepad2,
  HandCoins,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Monitor,
  NotebookPen,
  BookOpen,
  Settings,
  UserCircle,
  Users,
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

type MenuItem = {
  title: string;
  url?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: Array<{ title: string; url: string }>;
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

/**
 * 侧边栏分组策略：按业务域拆为 5 组，每组 3-4 项。
 * 图标折叠模式下 SidebarGroupLabel 自动隐藏，不额外占用空间。
 */
const menuGroups: MenuGroup[] = [
  {
    label: "概览",
    items: [
      { title: "仪表盘", url: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "内容管理",
    items: [
      { title: "博客管理", url: "/admin/blog", icon: FileText },
      { title: "项目管理", url: "/admin/projects", icon: FolderKanban },
      { title: "游戏管理", url: "/admin/games", icon: Gamepad2 },
      { title: "知识库", url: "/admin/knowledge", icon: BookOpen },
    ],
  },
  {
    label: "用户与互动",
    items: [
      { title: "用户管理", url: "/admin/users", icon: Users },
      { title: "评论管理", url: "/admin/comments", icon: MessageSquare },
      { title: "留言板", url: "/admin/guestbook", icon: NotebookPen },
      { title: "AI 客服", url: "/admin/chat", icon: Bot },
    ],
  },
  {
    label: "运营与增长",
    items: [
      { title: "公告管理", url: "/admin/announcements", icon: Megaphone },
      { title: "线索管理", url: "/admin/leads", icon: NotebookPen },
      { title: "赞助记录", url: "/admin/sponsors", icon: HandCoins },
      { title: "通知中心", url: "/admin/notifications", icon: Bell },
    ],
  },
  {
    label: "个人与系统",
    items: [
      { title: "作者资料", url: "/admin/author", icon: UserCircle },
      { title: "可视化大屏", url: "/admin/visual", icon: Monitor },
      { title: "前台显隐", url: "/admin/settings", icon: Settings },
      {
        title: "系统设置",
        icon: Settings,
        children: [
          { title: "通知邮箱", url: "/admin/settings/notify" },
          { title: "个人资料", url: "/admin/settings/profile" },
        ],
      },
    ],
  },
];

/** 判断当前 path 是否匹配某个菜单项（含子项） */
function isItemActive(pathname: string, item: MenuItem): boolean {
  if (item.url) return pathname === item.url || pathname.startsWith(`${item.url}/`);
  if (item.children) return item.children.some((c) => pathname === c.url || pathname.startsWith(`${c.url}/`));
  return false;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [user] = useState<{ name?: string; email?: string; image?: string } | null>(() => {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  });
  // 通用化：用 Set 跟踪所有带 children 的项的展开状态，key = title
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    // 根据当前路由自动展开匹配的带 children 项
    for (const group of menuGroups) {
      for (const item of group.items) {
        if (item.children?.some((c) => pathname === c.url || pathname.startsWith(`${c.url}/`))) {
          initial.add(item.title);
        }
      }
    }
    return initial;
  });

  const toggleExpanded = (title: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

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
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isItemActive(pathname, item);
                  const open = expanded.has(item.title);

                  if (item.children?.length) {
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          isActive={active}
                          tooltip={item.title}
                          onClick={() => toggleExpanded(item.title)}
                        >
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                          <ChevronRight className={`ml-auto size-4 transition-transform ${open ? "rotate-90" : ""}`} />
                        </SidebarMenuButton>
                        {open && (
                          <SidebarMenuSub>
                            {item.children.map((child) => (
                              <SidebarMenuSubItem key={child.url}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={pathname === child.url || pathname.startsWith(`${child.url}/`)}
                                >
                                  <Link href={child.url}>
                                    <span>{child.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        )}
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <Link href={item.url!}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.image} alt={user?.name || "User"} />
                    <AvatarFallback className="rounded-lg">{user?.name?.charAt(0)?.toUpperCase() || "A"}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name || "管理员"}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email || "admin@example.com"}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" side="top" align="start" sideOffset={4}>
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
