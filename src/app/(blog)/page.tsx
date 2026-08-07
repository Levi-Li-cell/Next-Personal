"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BriefcaseBusiness, FileUser, NotebookPen, Shapes, Sparkles } from "lucide-react";

type BlogCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  targetAudience: "hr" | "client" | "both";
};

type ProjectCard = {
  id: string;
  title: string;
  description: string;
  targetAudience: "hr" | "client" | "both";
};

const proofItems = [
  {
    title: "项目页保留并强化",
    description: "继续展示案例、技术选型和实际交付能力，作为甲方判断是否发需求的证据。",
  },
  {
    title: "博客页继续承载专业度",
    description: "技术文章、复盘和方案拆解用于证明思考深度，帮助 HR 快速判断岗位匹配。",
  },
  {
    title: "统一转化到线索后台",
    description: "所有面试邀约和合作需求都进入后台线索池，不再散落在聊天和留言里。",
  },
];

const audienceCards = [
  {
    href: "/for-hr",
    icon: FileUser,
    title: "我是 HR / 招聘经理",
    summary: "快速判断岗位匹配度、查看代表项目和简历证据链。",
    bullets: ["岗位适配", "简历下载", "面试邀约"],
  },
  {
    href: "/for-clients",
    icon: BriefcaseBusiness,
    title: "我是甲方 / 合作方",
    summary: "快速了解服务范围、过往案例和项目沟通入口。",
    bullets: ["服务说明", "案例筛选", "需求提交"],
  },
];

export default function LandingPage() {
  const [featuredBlogs, setFeaturedBlogs] = useState<BlogCard[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<ProjectCard[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [blogRes, projectRes] = await Promise.all([
          fetch("/api/blog?featured=true&limit=3"),
          fetch("/api/projects?featured=true&limit=3"),
        ]);
        const [blogData, projectData] = await Promise.all([blogRes.json(), projectRes.json()]);
        if (blogData.success) setFeaturedBlogs(blogData.data || []);
        if (projectData.success) setFeaturedProjects(projectData.data || []);
      } catch (error) {
        console.error("Failed to load featured content:", error);
      }
    };

    load();
  }, []);

  return (
    <div className="min-h-screen overflow-hidden bg-[#08090d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(243,201,106,0.16),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(74,140,255,0.16),transparent_25%),linear-gradient(180deg,#08090d_0%,#10141b_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      <section className="relative mx-auto flex max-w-7xl flex-col gap-14 px-6 pb-20 pt-28 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#f3c96a]/35 bg-[#f3c96a]/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-[#f3c96a]">
            <Sparkles className="h-3.5 w-3.5" />
            Dual Funnel Portfolio
          </div>
          <h1 className="font-serif text-5xl leading-[0.95] tracking-tight text-white md:text-7xl">
            把个人站改成
            <span className="block text-[#f3c96a]">招聘与合作双入口</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 md:text-lg">
            这个站现在不再只是展示内容，而是把博客、项目和作者信息重新组织成两条清晰路径：一条帮助 HR 判断是否约面试，一条帮助甲方判断是否发需求。
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/for-hr" className="inline-flex items-center gap-2 rounded-full bg-[#f3c96a] px-6 py-3 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5">
              进入招聘方入口
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/for-clients" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white/90 transition-transform duration-200 hover:-translate-y-0.5">
              进入合作入口
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/author" className="inline-flex items-center gap-2 rounded-full border border-transparent px-2 py-3 text-sm text-white/58 hover:text-white">
              查看原作者页
            </Link>
          </div>
        </div>

        <div className="grid w-full max-w-xl gap-4">
          {audienceCards.map((card) => (
            <Link key={card.href} href={card.href} className="group rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-[#f3c96a]/35">
              <div className="mb-5 flex items-center justify-between">
                <card.icon className="h-8 w-8 text-[#f3c96a]" />
                <ArrowRight className="h-4 w-4 text-white/45 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#f3c96a]" />
              </div>
              <h2 className="text-2xl font-semibold text-white">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-white/65">{card.summary}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {card.bullets.map((bullet) => (
                  <span key={bullet} className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60">
                    {bullet}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-8 flex items-center gap-3">
          <Shapes className="h-5 w-5 text-[#f3c96a]" />
          <h2 className="text-lg uppercase tracking-[0.32em] text-white/55">本次改造目标</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {proofItems.map((item) => (
            <div key={item.title} className="rounded-[1.75rem] border border-white/10 bg-black/18 p-6">
              <h3 className="text-xl font-medium text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/62">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/4 p-6">
            <h3 className="text-xl font-semibold text-white">精选博客</h3>
            <p className="mt-2 text-sm text-white/58">优先展示能证明思考深度和方案能力的文章。</p>
            <div className="mt-5 space-y-4">
              {featuredBlogs.slice(0, 3).map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="block rounded-2xl border border-white/8 bg-black/20 p-4 transition hover:border-[#f3c96a]/35">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-medium text-white">{post.title}</h4>
                    <span className="text-xs text-[#f3c96a]">{post.targetAudience === "hr" ? "HR" : post.targetAudience === "client" ? "甲方" : "双向"}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-white/60">{post.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/4 p-6">
            <h3 className="text-xl font-semibold text-white">精选项目</h3>
            <p className="mt-2 text-sm text-white/58">优先展示能证明交付能力和业务理解的案例。</p>
            <div className="mt-5 space-y-4">
              {featuredProjects.slice(0, 3).map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`} className="block rounded-2xl border border-white/8 bg-black/20 p-4 transition hover:border-[#f3c96a]/35">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-medium text-white">{project.title}</h4>
                    <span className="text-xs text-[#f3c96a]">{project.targetAudience === "hr" ? "HR" : project.targetAudience === "client" ? "甲方" : "双向"}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-white/60">{project.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto grid max-w-7xl gap-6 px-6 pb-24 md:grid-cols-3">
        <Link href="/blog" className="rounded-[1.75rem] border border-white/10 bg-white/4 p-6 transition-transform duration-200 hover:-translate-y-1">
          <NotebookPen className="mb-4 h-7 w-7 text-[#f3c96a]" />
          <h3 className="text-xl font-semibold text-white">博客</h3>
          <p className="mt-3 text-sm leading-7 text-white/62">保留技术文章与方案复盘，用来证明思考深度和表达能力。</p>
        </Link>
        <Link href="/projects" className="rounded-[1.75rem] border border-white/10 bg-white/4 p-6 transition-transform duration-200 hover:-translate-y-1">
          <BriefcaseBusiness className="mb-4 h-7 w-7 text-[#f3c96a]" />
          <h3 className="text-xl font-semibold text-white">项目</h3>
          <p className="mt-3 text-sm leading-7 text-white/62">保留案例和技术栈展示，并强化为真实交付能力的证明页面。</p>
        </Link>
        <Link href="/admin/leads" className="rounded-[1.75rem] border border-white/10 bg-white/4 p-6 transition-transform duration-200 hover:-translate-y-1">
          <FileUser className="mb-4 h-7 w-7 text-[#f3c96a]" />
          <h3 className="text-xl font-semibold text-white">后台线索</h3>
          <p className="mt-3 text-sm leading-7 text-white/62">所有前台表单统一沉淀进后台，方便后续跟进招聘机会和合作机会。</p>
        </Link>
      </section>
    </div>
  );
}
