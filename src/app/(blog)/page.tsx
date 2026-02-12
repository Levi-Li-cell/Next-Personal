"use client";

import { motion } from 'motion/react';
import { Sparkles, Home, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center max-w-3xl"
            >
                <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full mb-6"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                >
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-300 text-sm">欢迎来到我的个人博客</span>
                </motion.div>

                <h1 className="text-5xl md:text-7xl font-bold mb-6">
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                        探索创意与技术
                    </span>
                </h1>

                <p className="text-white/60 text-lg md:text-xl mb-10 leading-relaxed">
                    在这里，我分享关于前端开发、UI设计和技术趋势的见解。
                    一起探索数字世界的无限可能。
                </p>

                <motion.div
                    className="flex flex-wrap gap-4 justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <Link href="/blog">
                        <motion.button
                            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium flex items-center gap-2"
                            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(168, 85, 247, 0.5)' }}
                            whileTap={{ scale: 0.95 }}
                        >
                            浏览博客
                            <ArrowRight className="w-4 h-4" />
                        </motion.button>
                    </Link>
                    <Link href="/author">
                        <motion.button
                            className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-full font-medium border border-white/20 hover:border-white/40 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            关于作者
                        </motion.button>
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    );
}
