"use client";

import { motion } from 'motion/react';
import { BookOpen, Calendar, ArrowRight } from 'lucide-react';

const blogPosts = [
    {
        id: 1,
        title: "现代前端开发最佳实践",
        excerpt: "探索React、Next.js等现代前端技术的最佳实践，提升开发效率和代码质量。",
        date: "2026-02-01",
        category: "前端开发",
    },
    {
        id: 2,
        title: "设计系统构建指南",
        excerpt: "从零开始构建一个可扩展的设计系统，包括颜色、排版和组件规范。",
        date: "2026-01-25",
        category: "UI设计",
    },
    {
        id: 3,
        title: "性能优化技巧",
        excerpt: "Web性能优化的实用技巧，让你的网站加载更快、响应更及时。",
        date: "2026-01-18",
        category: "性能优化",
    },
];

export default function BlogPage() {
    return (
        <div className="container mx-auto px-6 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                        博客文章
                    </span>
                </h1>
                <p className="text-white/60 text-lg">分享技术见解与项目经验</p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {blogPosts.map((post, index) => (
                    <motion.article
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer"
                        whileHover={{ y: -5 }}
                    >
                        <div className="flex items-center gap-2 text-purple-400 text-sm mb-3">
                            <BookOpen className="w-4 h-4" />
                            <span>{post.category}</span>
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-300 transition-colors">
                            {post.title}
                        </h2>
                        <p className="text-white/60 text-sm mb-4 line-clamp-2">
                            {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white/40 text-sm">
                                <Calendar className="w-4 h-4" />
                                <span>{post.date}</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </motion.article>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center mt-12"
            >
                <p className="text-white/40">更多文章即将发布...</p>
            </motion.div>
        </div>
    );
}
