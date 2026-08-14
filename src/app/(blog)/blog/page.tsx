"use client";

import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, BookOpen, Calendar, ChevronDown, Info, Loader2, Search, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ConversionCta } from "@/components/conversion/ConversionCta";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  status: string;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  publishedAt: string | null;
}

interface BlogResponse {
  success: boolean;
  data: BlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  categories?: string[];
}

export default function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    async function fetchBlogPosts() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (search) params.append("search", search);
        if (selectedCategory) params.append("category", selectedCategory);

        const response = await fetch(`/api/blog?${params.toString()}`);
        const data: BlogResponse = await response.json();

        if (!data.success) {
          setError("获取博客列表失败");
          return;
        }

        setBlogPosts(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
        setCategories(data.categories?.length ? data.categories : [...new Set(data.data.map((post) => post.category))]);
      } catch (err) {
        console.error("Failed to fetch blog posts:", err);
        setError("网络错误，请稍后重试");
      } finally {
        setLoading(false);
      }
    }

    fetchBlogPosts();
  }, [limit, page, search, selectedCategory]);

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.replace(regex, '<mark class="bg-accent/20 px-1 text-accent">$1</mark>');
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <div className="mb-6 rounded-[1.75rem] border border-ink/14 bg-[linear-gradient(135deg,rgba(243,201,106,0.12),rgba(255,255,255,0.04))] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Proof Layer</p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/68">
            博客页继续保留，但职责更明确了：给 HR 看思考深度，给甲方看方案拆解能力。每篇文章都是专业能力的证明，而不是单纯归档。
          </p>
        </div>
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">
          <span className="bg-gradient-to-r from-accent via-peach to-ink bg-clip-text text-transparent">
            博客文章
          </span>
        </h1>
        <p className="text-lg text-ink/60">保留技术文章、方案拆解和项目复盘，作为专业度与表达能力的证据。</p>
      </motion.div>

      {!loading && !error && (
        <div className="mb-8 flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
              }}
              className="relative w-full md:w-72"
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <Input
                placeholder="搜索文章标题或摘要"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="border-ink/14 bg-ink/5 pl-10"
              />
            </form>
            <div className="flex items-center gap-4">
              <div className="text-sm text-ink/60">
                显示 {total === 0 ? 0 : (page - 1) * limit + 1} - {Math.min(page * limit, total)} / 共 {total} 篇
              </div>
              <Select
                value={limit.toString()}
                onValueChange={(value) => {
                  setLimit(parseInt(value, 10));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-32 border-ink/14 bg-ink/5">
                  <SelectValue placeholder="每页数量" />
                </SelectTrigger>
                <SelectContent className="border-ink/14 bg-zinc-900 text-ink">
                  <SelectItem value="3">3 篇</SelectItem>
                  <SelectItem value="6">6 篇</SelectItem>
                  <SelectItem value="12">12 篇</SelectItem>
                  <SelectItem value="24">24 篇</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-ink/14 bg-ink/5 px-3 py-2 text-xs text-ink/60">
            <Info className="mt-0.5 h-4 w-4 text-accent" />
            <p>建议优先看与岗位、业务方向相关的文章。搜索会匹配标题和摘要，分类筛选用于快速定位主题。</p>
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Badge
                className={`cursor-pointer px-4 py-2 ${selectedCategory === "" ? "bg-accent/20 text-accent" : "bg-ink/10 text-ink/80 hover:bg-ink/20"}`}
                onClick={() => {
                  setSelectedCategory("");
                  setPage(1);
                }}
              >
                <Tag className="mr-2 inline h-4 w-4" />
                全部分类
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category}
                  className={`cursor-pointer px-4 py-2 ${selectedCategory === category ? "bg-accent/20 text-accent" : "bg-ink/10 text-ink/80 hover:bg-ink/20"}`}
                  onClick={() => {
                    setSelectedCategory(category === selectedCategory ? "" : category);
                    setPage(1);
                  }}
                >
                  <Tag className="mr-2 inline h-4 w-4" />
                  {category}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

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
      ) : blogPosts.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-ink/60">{search || selectedCategory ? "没有找到匹配的文章" : "暂无博客文章"}</p>
        </div>
      ) : (
        <div className="columns-1 gap-6 [column-fill:_balance] md:columns-2 lg:columns-3">
          {blogPosts.map((post, index) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="mb-6 block break-inside-avoid">
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                whileHover={{ y: -5 }}
                className="group overflow-hidden rounded-2xl border border-ink/14 bg-ink/5 backdrop-blur-sm transition-all hover:border-accent/40"
              >
                {post.coverImage && (
                  <div className="overflow-hidden border-b border-ink/14">
                    <img src={post.coverImage} alt={post.title} className="h-40 w-full object-cover object-top" />
                  </div>
                )}
                <div className="p-6">
                  <div className="mb-3 flex items-center gap-2 text-sm text-accent">
                    <BookOpen className="h-4 w-4" />
                    <span>{post.category}</span>
                  </div>
                  <h2
                    className="mb-3 text-xl font-semibold text-ink transition-colors group-hover:text-accent"
                    dangerouslySetInnerHTML={{ __html: highlightText(post.title, search) }}
                  />
                  <p
                    className="mb-4 line-clamp-3 text-sm text-ink/60"
                    dangerouslySetInnerHTML={{ __html: highlightText(post.excerpt || "", search) }}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-ink/40">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(post.createdAt).toLocaleDateString("zh-CN")}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-accent opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </div>
              </motion.article>
            </Link>
          ))}
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-12 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="h-10 w-10 text-ink/60 hover:bg-ink/10 hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1).map((pageNum) => (
              <Button
                key={pageNum}
                variant={page === pageNum ? "default" : "ghost"}
                onClick={() => setPage(pageNum)}
                className={page === pageNum ? "h-10 w-10 bg-accent text-black hover:bg-accent" : "h-10 w-10 text-ink/60 hover:bg-ink/10 hover:text-ink"}
              >
                {pageNum}
              </Button>
            ))}
            {totalPages > 5 && (
              <Button variant="ghost" className="h-10 w-10 text-ink/60 hover:bg-ink/10 hover:text-ink">
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              disabled={page === totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="h-10 w-10 text-ink/60 hover:bg-ink/10 hover:text-ink"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      <ConversionCta
        eyebrow="Read And Convert"
        title="如果这些文章体现了你要找的能力，下一步就直接沟通"
        description="博客页负责证明思考方式和技术判断，真正的下一步应该是约面试或提交合作需求。"
      />
    </div>
  );
}
