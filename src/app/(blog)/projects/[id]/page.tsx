"use client";

import { motion } from "motion/react";
import { ArrowLeft, Calendar, ExternalLink, Folder, Github } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ConversionCta } from "@/components/conversion/ConversionCta";

interface Project {
  id: string;
  title: string;
  description: string;
  content: string;
  coverImage: string | null;
  techStack: string[];
  targetAudience?: "hr" | "client" | "both";
  ctaType?: "hr" | "client" | "both";
  featured?: boolean;
  demoUrl: string | null;
  githubUrl: string | null;
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
        const response = await fetch(`/api/projects/${id}`);
        const data: ProjectDetailResponse = await response.json();

        if (!data.success) {
          setError("获取项目详情失败");
          return;
        }

        setProject(data.data);
      } catch (err) {
        console.error("Failed to fetch project detail:", err);
        setError("网络错误，请稍后重试");
      } finally {
        setLoading(false);
      }
    }

    fetchProjectDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[#f3c96a]" />
          <span className="ml-3 text-white/60">加载中...</span>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="rounded-lg border border-red-500/30 bg-red-500/20 p-6 text-center">
          <p className="text-red-300">{error || "项目不存在"}</p>
          <button onClick={() => router.push("/projects")} className="mt-4 rounded-md bg-[#f3c96a] px-4 py-2 text-black">
            返回项目列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8 flex items-center gap-2 text-white/60 hover:text-white" onClick={() => router.push("/projects")}>
        <ArrowLeft className="h-5 w-5" />
        <span>返回项目列表</span>
      </motion.button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="mb-4 text-3xl font-bold leading-tight text-white md:mb-0 md:text-4xl">{project.title}</h1>
          <div className="flex gap-3">
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-white/5 p-2 transition-colors hover:bg-white/10" aria-label="GitHub 仓库">
                <Github className="h-6 w-6 text-white/80 hover:text-white" />
              </a>
            )}
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-white/5 p-2 transition-colors hover:bg-white/10" aria-label="项目演示">
                <ExternalLink className="h-6 w-6 text-white/80 hover:text-white" />
              </a>
            )}
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-white/60">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>创建于 {new Date(project.createdAt).toLocaleDateString("zh-CN")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            <span>状态 {project.status === "published" ? "已发布" : "草稿"}</span>
          </div>
        </div>

        {project.coverImage && (
          <div className="mb-8 overflow-hidden rounded-xl border border-white/10">
            <img src={project.coverImage} alt={project.title} className="block h-auto w-full object-top" />
          </div>
        )}

        <div className="mb-12">
          <h2 className="mb-4 text-2xl font-bold text-white">项目描述</h2>
          <p className="leading-relaxed text-white/70">{project.description}</p>
        </div>

        {project.content && (
          <div className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-white">项目详情</h2>
            <div className="prose prose-invert max-w-none text-white prose-a:text-[#9ac6ff] prose-blockquote:text-white/85 prose-code:text-white prose-headings:text-white prose-li:text-white prose-p:text-white prose-strong:text-white">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{project.content}</ReactMarkdown>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-white">技术栈</h2>
          <div className="flex flex-wrap gap-3">
            {project.techStack.map((tech, index) => (
              <motion.span key={tech} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * index }} className="rounded-lg bg-[#f3c96a]/14 px-4 py-2 text-[#f3c96a]">
                {tech}
              </motion.span>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-white">项目链接</h2>
          <div className="space-y-3">
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10">
                <Github className="h-5 w-5 text-white/80" />
                <span className="text-white transition-colors hover:text-[#f3c96a]">{project.githubUrl}</span>
              </a>
            )}
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10">
                <ExternalLink className="h-5 w-5 text-white/80" />
                <span className="text-white transition-colors hover:text-[#f3c96a]">{project.demoUrl}</span>
              </a>
            )}
          </div>
        </div>

        <ConversionCta
          eyebrow="Case To Contact"
          title="如果这个项目方向和你的需求接近，下一步就是直接发起沟通"
          description="项目详情页负责证明交付能力，真正的转化动作应该是进入招聘方入口或合作入口。"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          {project.ctaType !== "client" && (
            <Link href="/for-hr" className="rounded-full bg-[#f3c96a] px-5 py-2.5 text-sm font-medium text-black">
              招聘方入口
            </Link>
          )}
          {project.ctaType !== "hr" && (
            <Link href="/for-clients" className="rounded-full border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/90">
              合作入口
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
}
