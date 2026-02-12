"use client";

import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, LogIn, User, LogOut, Loader2 } from 'lucide-react';
import { useSession, signOut } from '@/lib/auth/client';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const navItems = [
    { id: 'home', label: '首页', href: '/' },
    { id: 'blog', label: '博客', href: '/blog' },
    { id: 'projects', label: '项目', href: '/projects' },
    { id: 'author', label: '作者', href: '/author' },
];

export default function TopNavbar() {
    const pathname = usePathname();
    const session = useSession();
    const user = session.data?.user;

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    return (
        <motion.nav
            className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-xl border-b border-white/10"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, type: "spring" }}
        >
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/">
                        <motion.div
                            className="text-white text-2xl tracking-wider relative cursor-pointer"
                            whileHover={{ scale: 1.05 }}
                            animate={{
                                textShadow: [
                                    "0 0 10px rgba(168, 85, 247, 0.5)",
                                    "0 0 20px rgba(168, 85, 247, 0.8)",
                                    "0 0 10px rgba(168, 85, 247, 0.5)",
                                ]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                                李伟
                            </span>
                            <motion.span
                                className="absolute -top-2 -right-2"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            >
                                <Sparkles className="w-4 h-4 text-yellow-400" />
                            </motion.span>
                        </motion.div>
                    </Link>

                    {/* Center Navigation */}
                    <div className="hidden md:flex items-center gap-2">
                        {navItems.map((item, index) => (
                            <Link key={item.id} href={item.href}>
                                <motion.div
                                    className="relative px-4 py-2 rounded-full transition-all cursor-pointer"
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {isActive(item.href) && (
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 rounded-full"
                                            layoutId="topNavActive"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            style={{
                                                boxShadow: '0 0 20px rgba(168, 85, 247, 0.3), inset 0 0 20px rgba(168, 85, 247, 0.1)'
                                            }}
                                        />
                                    )}
                                    <motion.span
                                        className={`relative z-10 font-medium ${isActive(item.href)
                                            ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent'
                                            : 'text-white/70 hover:text-white'
                                            }`}
                                    >
                                        {item.label}
                                    </motion.span>
                                </motion.div>
                            </Link>
                        ))}
                    </div>


                    {/* Login/User Button */}
                    <div className="flex items-center gap-4">
                        {session.isPending ? (
                            <div className="h-10 w-10 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                            </div>
                        ) : user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="relative rounded-full focus:outline-none"
                                    >
                                        <div className="p-[2px] rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500">
                                            <Avatar className="h-9 w-9 border-2 border-black">
                                                <AvatarImage src={user.image || ''} alt={user.name || ''} />
                                                <AvatarFallback className="bg-zinc-800 text-white font-medium">
                                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </motion.button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-black/90 backdrop-blur-xl border-white/10 text-white p-2 rounded-xl shadow-2xl shadow-purple-500/10">
                                    <div className="px-2 py-1.5 mb-1">
                                        <p className="text-sm font-medium text-white">{user.name}</p>
                                        <p className="text-xs text-white/50 truncate">{user.email}</p>
                                    </div>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <Link href="/dashboard">
                                        <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white rounded-lg my-1">
                                            <User className="mr-2 h-4 w-4" />
                                            <span>个人中心</span>
                                        </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuItem
                                        className="cursor-pointer focus:bg-red-500/20 focus:text-red-400 text-red-400 rounded-lg my-1"
                                        onClick={() => signOut()}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>退出登录</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Link href="/signin">
                                <motion.button
                                    className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium"
                                    whileHover={{
                                        scale: 1.05,
                                        boxShadow: '0 0 25px rgba(168, 85, 247, 0.5)'
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <LogIn className="w-4 h-4" />
                                    <span>登录</span>
                                </motion.button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}
