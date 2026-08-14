"use client";

import { motion } from "motion/react";
import { ArrowRight, ExternalLink, Folder, Github, Loader2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ConversionCta } from "@/components/conversion/ConversionCta";

interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  demoUrl: string | null;
  githubUrl: string | null;
  coverImage: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectResponse {
  success: boolean;
  data: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function ExternalIconLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <span
      role="link"
      tabIndex={0}
      aria-label={label}
      title={label}
      className="inline-flex cursor-pointer items-center text-ink/70 hover:text-ink"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        window.open(href, "_blank", "noopener,noreferrer");
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          window.open(href, "_blank", "noopener,noreferrer");
        }
      }}
    >
      {children}
    </span>
  );
}


export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/projects");
        const data: ProjectResponse = await response.json();

        if (!data.success) {
          setError("获取项目列表失败");
          return;
        }

        setProjects(data.data);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
        setError("网络错误，请稍后重试");
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  return (
    <div className="container mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <div className="mb-6 rounded-[1.75rem] border border-ink/14 bg-[linear-gradient(135deg,rgba(243,201,106,0.12),rgba(255,255,255,0.04))] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Case Proof</p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/68">
            项目页继续保留，但定位已经变成“交付能力证据库”。招聘方看复杂度和技术栈，甲方看方案与结果。
          </p>
        </div>
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">
          <span className="bg-gradient-to-r from-accent via-peach to-ink bg-clip-text text-transparent">
            项目作品
          </span>
        </h1>
        <p className="text-lg text-ink/60">保留项目案例与技术信息，把它们升级成真正的业务转化证据。</p>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <span className="ml-3 text-ink/60">加载中...</span>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/20 p-6 text-center">
          <p className="text-red-300">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 rounded-md bg-accent px-4 py-2 text-black">
            重试
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-ink/60">暂无项目</p>
        </div>
      ) : (
        <div className="columns-1 gap-6 [column-fill:_balance] md:columns-2 lg:columns-3">
          {projects.map((project, index) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="mb-6 block break-inside-avoid">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                whileHover={{ y: -5 }}
                className="group overflow-hidden rounded-2xl border border-ink/14 bg-ink/5 backdrop-blur-sm transition-all hover:border-accent/40"
              >
                {project.coverImage && (
                  <div className="overflow-hidden border-b border-ink/14">
                    <img src={project.coverImage} alt={project.title} className="h-40 w-full object-cover object-top" />
                  </div>
                )}
                <div className="p-6">
                  <div className={`mb-4 flex items-center justify-between ${!project.coverImage ? "gap-4" : ""}`}>
                    <div className={`flex items-center gap-4 ${!project.coverImage ? "w-full" : ""}`}>
                      {!project.coverImage && (
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#f3c96a] to-[#ff8b5d]">
                          <Folder className="h-6 w-6 text-black" />
                        </div>
                      )}
                      {!project.coverImage && <h2 className="flex-grow text-xl font-semibold text-ink transition-colors group-hover:text-accent">{project.title}</h2>}
                    </div>
                    <div className="flex gap-3">
                      {project.githubUrl && (
                        <ExternalIconLink href={project.githubUrl} label="GitHub 仓库">
                          <Github className="h-5 w-5" />
                        </ExternalIconLink>
                      )}
                      {project.demoUrl && (
                        <ExternalIconLink href={project.demoUrl} label="在线演示">
                          <ExternalLink className="h-5 w-5" />
                        </ExternalIconLink>
                      )}
                      <ArrowRight className="h-5 w-5 text-accent opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </div>
                  {project.coverImage && <h2 className="mb-3 text-xl font-semibold text-ink transition-colors group-hover:text-accent">{project.title}</h2>}
                  <p className="mb-4 text-sm leading-7 text-ink/65">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <span key={tech} className="rounded-full bg-accent/14 px-3 py-1 text-xs text-accent">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}

      <ConversionCta
        eyebrow="Projects To Pipeline"
        title="项目看完以后，下一步应该是发起合作或招聘沟通"
        description="案例页的职责是缩短判断时间，让感兴趣的人直接进入招聘方入口或合作入口。"
      />
    </div>
  );
}
