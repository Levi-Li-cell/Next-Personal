"use client";

import { motion } from 'motion/react';
import { Folder, ExternalLink, Github } from 'lucide-react';

const projects = [
    {
        id: 1,
        title: "个人博客系统",
        description: "基于Next.js构建的现代化个人博客，支持Markdown和暗色主题。",
        tech: ["Next.js", "TypeScript", "Tailwind CSS"],
        link: "#",
        github: "#",
    },
    {
        id: 2,
        title: "设计系统组件库",
        description: "可复用的React组件库，包含50+常用UI组件。",
        tech: ["React", "Storybook", "CSS Modules"],
        link: "#",
        github: "#",
    },
    {
        id: 3,
        title: "AI聊天助手",
        description: "集成大语言模型的智能聊天助手，支持上下文对话。",
        tech: ["Python", "FastAPI", "LangChain"],
        link: "#",
        github: "#",
    },
];

export default function ProjectsPage() {
    return (
        <div className="container mx-auto px-6 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                        项目作品
                    </span>
                </h1>
                <p className="text-white/60 text-lg">我参与开发的一些项目</p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project, index) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all"
                        whileHover={{ y: -5 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                <Folder className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex gap-3">
                                <a href={project.github} className="text-white/40 hover:text-white transition-colors">
                                    <Github className="w-5 h-5" />
                                </a>
                                <a href={project.link} className="text-white/40 hover:text-white transition-colors">
                                    <ExternalLink className="w-5 h-5" />
                                </a>
                            </div>
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-300 transition-colors">
                            {project.title}
                        </h2>
                        <p className="text-white/60 text-sm mb-4">
                            {project.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {project.tech.map((tech) => (
                                <span
                                    key={tech}
                                    className="px-3 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-full"
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
