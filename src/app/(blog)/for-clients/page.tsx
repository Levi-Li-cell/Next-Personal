"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, Clock3, NotebookPen } from "lucide-react";
import { LeadCaptureForm } from "@/components/conversion/LeadCaptureForm";

type BlogCard = { id: string; title: string; slug: string; excerpt: string };
type ProjectCard = { id: string; title: string; description: string };

const serviceCards = [
  { title: "官网 / 内容站", description: "适合品牌官网、个人品牌站、博客内容站和营销落地页。" },
  { title: "后台管理系统", description: "适合管理后台、内容运营后台、简单业务系统和可视化面板。" },
  { title: "AI 功能集成", description: "适合聊天助手、知识库问答、内容生成和流程自动化能力接入。" },
];

export default function ForClientsPage() {
  const [blogs, setBlogs] = useState<BlogCard[]>([]);
  const [projects, setProjects] = useState<ProjectCard[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [blogRes, projectRes] = await Promise.all([
          fetch("/api/blog?featured=true&audience=client&limit=3"),
          fetch("/api/projects?featured=true&audience=client&limit=3"),
        ]);
        const [blogData, projectData] = await Promise.all([blogRes.json(), projectRes.json()]);
        if (blogData.success) setBlogs(blogData.data || []);
        if (projectData.success) setProjects(projectData.data || []);
      } catch (error) {
        console.error("Failed to load client recommendations:", error);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#08090d] text-white">
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-28">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <section>
            <p className="mb-5 text-xs uppercase tracking-[0.32em] text-[#f3c96a]">For Clients</p>
            <h1 className="max-w-3xl font-serif text-5xl leading-[0.95] md:text-6xl">
              先看案例与方法，
              <span className="block text-[#f3c96a]">再决定是否发需求</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/70">
              这里把合作方关心的问题前置了：能做什么、做过什么、怎么推进、怎么联系。项目页和博客页会继续保留，用来分别证明交付能力和方案思考能力。
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {serviceCards.map((card) => (
                <div key={card.title} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <h2 className="text-lg font-semibold text-white">{card.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-white/62">{card.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-[1.75rem] border border-white/10 bg-black/18 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-2xl font-semibold text-white">推荐案例</h3>
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
                  <h3 className="text-2xl font-semibold text-white">推荐文章</h3>
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

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/18 p-5">
                <BriefcaseBusiness className="mb-4 h-6 w-6 text-[#f3c96a]" />
                <h3 className="text-lg font-semibold text-white">看案例</h3>
                <p className="mt-3 text-sm leading-6 text-white/62">项目页作为交付能力证明，重点看目标、方案和结果。</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/18 p-5">
                <NotebookPen className="mb-4 h-6 w-6 text-[#f3c96a]" />
                <h3 className="text-lg font-semibold text-white">看思路</h3>
                <p className="mt-3 text-sm leading-6 text-white/62">博客页作为方案能力证明，重点看拆解方式和取舍逻辑。</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/18 p-5">
                <Clock3 className="mb-4 h-6 w-6 text-[#f3c96a]" />
                <h3 className="text-lg font-semibold text-white">发需求</h3>
                <p className="mt-3 text-sm leading-6 text-white/62">留下项目目标、预算和周期，后台统一跟进，不再只靠即时消息。</p>
              </div>
            </div>
          </section>

          <LeadCaptureForm
            type="client"
            sourcePage="/for-clients"
            title="直接提交合作需求"
            description="提交项目类型、预算范围、周期和目标后，需求会进入后台线索池，方便后续统一跟进。"
            submitLabel="提交合作需求"
          />
        </div>
      </div>
    </div>
  );
}
