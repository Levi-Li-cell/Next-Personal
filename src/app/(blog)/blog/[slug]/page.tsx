"use client";

import { motion } from "motion/react";
import { ArrowLeft, BookOpen, Calendar, Eye, MessageSquare, ThumbsUp } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { useSession } from "@/lib/auth/client";
import BlogComments from "@/components/BlogComments";
import { ConversionCta } from "@/components/conversion/ConversionCta";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: string;
  targetAudience?: "hr" | "client" | "both";
  ctaType?: "hr" | "client" | "both";
  featured?: boolean;
  tags: string[];
  authorId: string;
  status: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

interface BlogDetailResponse {
  success: boolean;
  data: BlogPost;
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  createdAt: string;
}

interface RelatedPostsResponse {
  success: boolean;
  data: RelatedPost[];
}

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  const galleryImages = useMemo(() => {
    if (!post) return [];
    const markdownImages = [...post.content.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map((match) => match[1]);
    return [...new Set([post.coverImage, ...markdownImages].filter((url): url is string => Boolean(url)))];
  }, [post]);

  useEffect(() => {
    async function fetchBlogDetail() {
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);

        const detailResponse = await fetch(`/api/blog/${slug}`);
        const detailData: BlogDetailResponse = await detailResponse.json();

        if (!detailData.success) {
          setError("获取博客详情失败");
          return;
        }

        setPost(detailData.data);

        const relatedResponse = await fetch(`/api/blog?category=${encodeURIComponent(detailData.data.category)}&limit=3`);
        const relatedData: RelatedPostsResponse = await relatedResponse.json();
        if (relatedData.success) {
          setRelatedPosts(relatedData.data.filter((item) => item.slug !== slug));
        }

        try {
          await fetch(`/api/blog/${slug}/view`, { method: "POST" });
        } catch (viewError) {
          console.error("Failed to track view:", viewError);
        }

        try {
          const likeResponse = await fetch(`/api/blog/${slug}/like`);
          if (likeResponse.ok) {
            const likeData = await likeResponse.json();
            if (likeData.success) {
              setLiked(likeData.liked);
              setLikeCount(likeData.likeCount);
            }
          }
        } catch (likeError) {
          console.error("Failed to fetch like state:", likeError);
        }
      } catch (err) {
        console.error("Failed to fetch blog detail:", err);
        setError("网络错误，请稍后重试");
      } finally {
        setLoading(false);
      }
    }

    fetchBlogDetail();
  }, [slug]);

  const handleLike = async () => {
    if (!session) {
      toast.error("请先登录");
      return;
    }

    if (isLiking) return;
    setIsLiking(true);

    try {
      const response = await fetch(`/api/blog/${slug}/like`, { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "点赞失败");
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch (err) {
      console.error("Failed to like blog:", err);
      toast.error("点赞失败");
    } finally {
      setIsLiking(false);
    }
  };

  const openImageViewer = (imageUrl: string) => {
    const index = galleryImages.findIndex((url) => url === imageUrl);
    setActiveImageIndex(index >= 0 ? index : 0);
  };

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

  if (error || !post) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="rounded-lg border border-red-500/30 bg-red-500/20 p-6 text-center">
          <p className="text-red-300">{error || "文章不存在"}</p>
          <button onClick={() => router.push("/blog")} className="mt-4 rounded-md bg-[#f3c96a] px-4 py-2 text-black">
            返回博客列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8 flex items-center gap-2 text-white/60 hover:text-white" onClick={() => router.push("/blog")}>
        <ArrowLeft className="h-5 w-5" />
        <span>返回博客列表</span>
      </motion.button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-white/60">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>{post.category}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{new Date(post.createdAt).toLocaleDateString("zh-CN")}</span>
          </div>
        </div>

        <h1 className="mb-6 text-3xl font-bold leading-tight text-white md:text-4xl">{post.title}</h1>

        {post.coverImage && (
          <div className="mb-8 overflow-hidden rounded-xl border border-white/10">
            <button type="button" className="block w-full cursor-zoom-in" onClick={() => openImageViewer(post.coverImage!)}>
              <img src={post.coverImage} alt={post.title} className="block h-auto w-full object-top" />
            </button>
          </div>
        )}

        <div className="prose prose-invert mb-12 max-w-none text-white prose-a:text-[#9ac6ff] prose-blockquote:text-white/85 prose-code:text-white prose-headings:text-white prose-li:text-white prose-p:text-white prose-strong:text-white">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({ src, alt }) => {
                if (!src || typeof src !== "string") return null;
                return (
                  <button type="button" className="my-4 block w-full cursor-zoom-in" onClick={() => openImageViewer(src)}>
                    <img src={src} alt={alt || "博客图片"} className="block w-full rounded-lg border border-white/10 object-top" />
                  </button>
                );
              },
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {post.tags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-[#f3c96a]/14 px-3 py-1 text-xs text-[#f3c96a]">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mb-12 flex items-center gap-6 text-white/60">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>{post.viewCount} 阅读</span>
          </div>
          <button onClick={handleLike} disabled={isLiking} className={`flex items-center gap-2 ${liked ? "text-[#f3c96a]" : "text-white/60 hover:text-white"}`}>
            <ThumbsUp className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            <span>{likeCount} 点赞</span>
          </button>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>{post.commentCount} 评论</span>
          </div>
        </div>

        <BlogComments slug={slug} />
      </motion.div>

      {relatedPosts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mx-auto mt-16 max-w-3xl">
          <h2 className="mb-6 text-2xl font-bold text-white">相关文章</h2>
          <div className="space-y-6">
            {relatedPosts.map((relatedPost, index) => (
              <motion.div
                key={relatedPost.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index }}
                className="cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-[#f3c96a]/40"
                onClick={() => router.push(`/blog/${relatedPost.slug}`)}
              >
                <h3 className="mb-2 text-lg font-semibold text-white transition-colors hover:text-[#f3c96a]">{relatedPost.title}</h3>
                <p className="mb-3 line-clamp-2 text-sm text-white/60">{relatedPost.excerpt}</p>
                <div className="flex items-center justify-between text-sm text-white/40">
                  <span>{relatedPost.category}</span>
                  <span>{new Date(relatedPost.createdAt).toLocaleDateString("zh-CN")}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="mx-auto max-w-3xl">
        <ConversionCta
          eyebrow="Article To Action"
          title="如果这篇文章体现了你要找的能力，下一步就别停在阅读"
          description="招聘方可以直接进入招聘入口发起面试沟通，合作方可以进入合作入口提交需求。"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          {post.ctaType !== "client" && (
            <Link href="/for-hr" className="rounded-full bg-[#f3c96a] px-5 py-2.5 text-sm font-medium text-black">
              招聘方入口
            </Link>
          )}
          {post.ctaType !== "hr" && (
            <Link href="/for-clients" className="rounded-full border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/90">
              合作入口
            </Link>
          )}
        </div>
      </div>

      {activeImageIndex !== null && galleryImages.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button type="button" className="absolute right-4 top-4 rounded-md bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20" onClick={() => setActiveImageIndex(null)}>
            关闭
          </button>
          <img src={galleryImages[activeImageIndex]} alt={`图片 ${activeImageIndex + 1}`} className="max-h-[85vh] max-w-[90vw] rounded-lg" />
        </div>
      )}
    </div>
  );
}
