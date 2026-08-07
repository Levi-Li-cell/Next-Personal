"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Download, FolderGit2, NotebookPen, ScanSearch } from "lucide-react";
import { LeadCaptureForm } from "@/components/conversion/LeadCaptureForm";

type BlogCard = { id: string; title: string; slug: string; excerpt: string };
type ProjectCard = { id: string; title: string; description: string };

const blocks = [
  {
    icon: ScanSearch,
    title: "岗位匹配判断",
    description: "先看技术栈覆盖、项目复杂度和独立交付能力，再决定是否进入面试流程。",
  },
  {
    icon: FolderGit2,
    title: "项目证据链",
    description: "项目页保留真实案例与实现细节，帮助判断技术深度和业务理解能力。",
  },
  {
    icon: NotebookPen,
    title: "技术表达能力",
    description: "博客页保留方案拆解和复盘文章，帮助判断沟通表达和工程思维。",
  },
];

export default function ForHrPage() {
  const [blogs, setBlogs] = useState<BlogCard[]>([]);
  const [projects, setProjects] = useState<ProjectCard[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [blogRes, projectRes] = await Promise.all([
          fetch("/api/blog?featured=true&audience=hr&limit=3"),
          fetch("/api/projects?featured=true&audience=hr&limit=3"),
        ]);
        const [blogData, projectData] = await Promise.all([blogRes.json(), projectRes.json()]);
        if (blogData.success) setBlogs(blogData.data || []);
        if (projectData.success) setProjects(projectData.data || []);
      } catch (error) {
        console.error("Failed to load HR recommendations:", error);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#08090d] text-white">
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-28">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <section>
            <p className="mb-5 text-xs uppercase tracking-[0.32em] text-[#f3c96a]">For Hiring Teams</p>
            <h1 className="max-w-3xl font-serif text-5xl leading-[0.95] md:text-6xl">
              用最短时间判断
              <span className="block text-[#f3c96a]">是否值得约面试</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/70">
              这个页面把招聘方真正关心的内容收拢在一起：岗位适配、项目证据、博客文章、联系入口。你不需要先完整看完整个站，再决定是否沟通。
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {blocks.map((block) => (
                <div key={block.title} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <block.icon className="mb-4 h-6 w-6 text-[#f3c96a]" />
                  <h2 className="text-lg font-semibold text-white">{block.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-white/62">{block.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-[1.75rem] border border-white/10 bg-black/18 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-2xl font-semibold text-white">推荐项目</h3>
                  <Link href="/projects" className="text-sm text-[#f3c96a]">
                    全部项目
                  </Link>
                </div>
                <div className="space-y-4">
                  {projects.slice(0, 3).map((project) => (
                    <Link key={project.id} href={`/projects/${project.id}`} className="block rounded-2xl border border-white/8 bg-white/5 p-4 transition hover:border-[#f3c96a]/35">
                      <h4 className="font-medium text-white">{project.title}</h4>
                      <p className="mt-2 line-clamp-2 text-sm text-white/60">{project.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-black/18 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-2xl font-semibold text-white">推荐博客</h3>
                  <Link href="/blog" className="text-sm text-[#f3c96a]">
                    全部文章
                  </Link>
                </div>
                <div className="space-y-4">
                  {blogs.slice(0, 3).map((post) => (
                    <Link key={post.id} href={`/blog/${post.slug}`} className="block rounded-2xl border border-white/8 bg-white/5 p-4 transition hover:border-[#f3c96a]/35">
                      <h4 className="font-medium text-white">{post.title}</h4>
                      <p className="mt-2 line-clamp-2 text-sm text-white/60">{post.excerpt}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/author" className="inline-flex items-center gap-2 rounded-full bg-[#f3c96a] px-6 py-3 text-sm font-semibold text-black">
                查看作者详情
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/author" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90">
                <Download className="h-4 w-4" />
                查看简历详情
              </Link>
            </div>
          </section>

          <LeadCaptureForm
            type="hr"
            sourcePage="/for-hr"
            title="直接发起面试沟通"
            description="填写岗位、团队信息和沟通方式后，线索会进入后台线索池。你也可以补充面试轮次、岗位级别和期望时间。"
            submitLabel="提交面试邀约"
          />
        </div>
      </div>
    </div>
  );
}
