"use client";

import { motion } from 'motion/react';
import { ArrowLeft, Calendar, ExternalLink, Github, Folder } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Project {
  id: string;
  title: string;
  description: string;
  content: string;
  techStack: string[];
  demoUrl: string | null;
  githubUrl: string | null;
  coverImage: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectDetailResponse {
  success: boolean;
  data: Project;
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjectDetail() {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // 获取项目详情
        const response = await fetch(`/api/projects/${id}`);
        const data: ProjectDetailResponse = await response.json();

        if (data.success) {
          setProject(data.data);
        } else {
          setError('获取项目详情失败');
        }
      } catch (err) {
        setError('网络错误，请稍后重试');
        console.error('获取项目详情失败:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProjectDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
          <span className="ml-3 text-white/60">加载中...</span>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 text-center">
          <p className="text-red-400">{error || '项目不存在'}</p>
          <button 
            onClick={() => router.push('/projects')}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-colors"
          >
            返回项目列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12">
      {/* 返回按钮 */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2 text-white/60 hover:text-white mb-8"
        onClick={() => router.push('/projects')}
      >
        <ArrowLeft className="w-5 h-5" />
        <span>返回项目列表</span>
      </motion.button>

      {/* 项目内容 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* 项目标题和链接 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 md:mb-0 leading-tight">
            {project.title}
          </h1>
          <div className="flex gap-3">
            {project.githubUrl && (
              <a 
                href={project.githubUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="GitHub 仓库"
              >
                <Github className="w-6 h-6 text-white/80 hover:text-white" />
              </a>
            )}
            {project.demoUrl && (
              <a 
                href={project.demoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="项目演示"
              >
                <ExternalLink className="w-6 h-6 text-white/80 hover:text-white" />
              </a>
            )}
          </div>
        </div>

        {/* 项目信息 */}
        <div className="flex flex-wrap items-center gap-4 mb-8 text-sm text-white/60">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>创建于 {new Date(project.createdAt).toLocaleDateString('zh-CN')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4" />
            <span>状态: {project.status === 'published' ? '已发布' : '草稿'}</span>
          </div>
        </div>

        {/* 封面图片 */}
        {project.coverImage && (
          <div className="mb-8 rounded-xl overflow-hidden border border-white/10">
            <img 
              src={project.coverImage} 
              alt={project.title} 
              className="block w-full h-auto object-top"
            />
          </div>
        )}

        {/* 项目描述 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">项目描述</h2>
          <p className="text-white/70 leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* 项目详细内容 */}
        {project.content && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">项目详情</h2>
            <div className="prose prose-invert max-w-none text-white prose-headings:text-white prose-p:text-white prose-strong:text-white prose-li:text-white prose-blockquote:text-white/90 prose-code:text-white prose-a:text-cyan-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{project.content}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* 技术栈 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">技术栈</h2>
          <div className="flex flex-wrap gap-3">
            {project.techStack.map((tech, index) => (
              <motion.span
                key={tech}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg"
              >
                {tech}
              </motion.span>
            ))}
          </div>
        </div>

        {/* 链接 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">项目链接</h2>
          <div className="space-y-3">
            {project.githubUrl && (
              <a 
                href={project.githubUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Github className="w-5 h-5 text-white/80" />
                <span className="text-white hover:text-purple-300 transition-colors">
                  {project.githubUrl}
                </span>
              </a>
            )}
            {project.demoUrl && (
              <a 
                href={project.demoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ExternalLink className="w-5 h-5 text-white/80" />
                <span className="text-white hover:text-purple-300 transition-colors">
                  {project.demoUrl}
                </span>
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
