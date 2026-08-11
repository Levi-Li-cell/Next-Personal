"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ExternalLink, Loader2, LogIn, LogOut, Settings, Sparkles } from "lucide-react";
import { useSession, signOut } from "@/lib/auth/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import FrontendNotificationBell from "@/components/FrontendNotificationBell";

const navItems = [
  { id: "author", label: "作者", href: "/author" },
  { id: "blog", label: "博客", href: "/blog" },
  { id: "projects", label: "项目", href: "/projects" },
  { id: "guestbook", label: "留言板", href: "/guestbook" },
];

export default function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const user = session.data?.user;
  const [adminLoading, setAdminLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (session.isPending) return;

      if (!user) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      try {
        const response = await fetch("/api/check-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
        const data = await response.json();
        setIsAdmin(data.isAdmin === true);
      } catch (error) {
        console.error("Failed to check admin status:", error);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdmin();
  }, [session.isPending, user]);

  const isActive = (href: string) => {
    if (href === "/author") return pathname === "/" || pathname.startsWith("/author");
    return pathname.startsWith(href);
  };

  const handleGoToAdmin = async () => {
    setAdminLoading(true);
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
    router.push("/admin");
    setAdminLoading(false);
  };

  return (
    <motion.nav
      className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, type: "spring" }}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/">
            <motion.div
              className="relative cursor-pointer text-2xl tracking-wider text-white"
              whileHover={{ scale: 1.05 }}
              animate={{
                textShadow: [
                  "0 0 10px rgba(243, 201, 106, 0.35)",
                  "0 0 20px rgba(243, 201, 106, 0.65)",
                  "0 0 10px rgba(243, 201, 106, 0.35)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="bg-gradient-to-r from-[#f3c96a] via-[#ff8b5d] to-[#9ac6ff] bg-clip-text text-transparent">
                李伟
              </span>
              <motion.span
                className="absolute -right-2 -top-2"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-4 w-4 text-[#f3c96a]" />
              </motion.span>
            </motion.div>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {navItems.map((item, index) => (
              <Link key={item.id} href={item.href}>
                <motion.div
                  className="relative cursor-pointer rounded-full px-4 py-2 transition-all"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isActive(item.href) && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-[#f3c96a]/20 via-[#ff8b5d]/18 to-[#9ac6ff]/18"
                      layoutId="topNavActive"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 text-sm font-medium ${isActive(item.href) ? "text-[#f3c96a]" : "text-white/70 hover:text-white"}`}>
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <FrontendNotificationBell />
            {session.isPending ? (
              <div className="flex h-10 w-10 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-white/50" />
              </div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative rounded-full focus:outline-none"
                  >
                    <div className="rounded-full bg-gradient-to-r from-[#f3c96a] via-[#ff8b5d] to-[#9ac6ff] p-[2px]">
                      <Avatar className="h-9 w-9 border-2 border-black">
                        <AvatarImage src={user.image || ""} alt={user.name || ""} />
                        <AvatarFallback className="bg-zinc-800 text-white font-medium">
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl border-white/10 bg-black/90 p-2 text-white backdrop-blur-xl">
                  <div className="mb-1 px-2 py-1.5">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="truncate text-xs text-white/50">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-white/10" />
                  {isAdmin && !checkingAdmin && (
                    <DropdownMenuItem
                      className="my-1 cursor-pointer rounded-lg text-[#f3c96a] focus:bg-[#f3c96a]/15 focus:text-[#f3c96a]"
                      onClick={handleGoToAdmin}
                      disabled={adminLoading}
                    >
                      {adminLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Settings className="mr-2 h-4 w-4" />}
                      <span>后台管理</span>
                      <ExternalLink className="ml-auto h-3 w-3" />
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    className="my-1 cursor-pointer rounded-lg text-red-400 focus:bg-red-500/20 focus:text-red-400"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <motion.button
                className="flex items-center gap-2 rounded-full bg-[#f3c96a] px-5 py-2 font-medium text-black"
                whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(243, 201, 106, 0.35)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/signin")}
              >
                <LogIn className="h-4 w-4" />
                <span>登录</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
