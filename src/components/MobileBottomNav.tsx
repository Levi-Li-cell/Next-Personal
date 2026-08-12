"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, MessageSquare, User, Wrench } from "lucide-react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useSession } from "@/lib/auth/client";

const navItems = [
  { href: "/author", label: "作者", icon: User, match: (path: string) => path === "/" || path.startsWith("/author") },
  { href: "/blog", label: "博客", icon: BookOpen, match: (path: string) => path.startsWith("/blog") },
  { href: "/projects", label: "项目", icon: Wrench, match: (path: string) => path.startsWith("/projects") || path.startsWith("/geo-lab") },
  { href: "/guestbook", label: "留言", icon: MessageSquare, match: (path: string) => path.startsWith("/guestbook") },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { flags } = useFeatureFlags();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role?.toLowerCase() === "admin";
  const canAccessAuthorPage = flags.showAuthorPage && (flags.allowPublicAuthorPage || isAdmin);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/85 backdrop-blur md:hidden">
      <div className="grid grid-cols-4 gap-1 px-2 py-2">
        {navItems.filter((item) => item.href !== "/author" || canAccessAuthorPage).map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center rounded-md py-1 text-[11px] transition-colors ${
                active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="mb-1 h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
