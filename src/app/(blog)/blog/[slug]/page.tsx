"use client";

import { motion } from 'motion/react';
import { ArrowLeft, Calendar, BookOpen, Eye, ThumbsUp, MessageSquare } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth/client';
import { toast } from 'sonner';
import BlogComments from '@/components/BlogComments';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: string;
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

  // 处理点赞
  const handleLike = async () => {
    if (!session) {
      toast.error('请先登录');
      return;
    }

    if (isLiking) return;

    setIsLiking(true);
    try {
      const response = await fetch(`/api/blog/${slug}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLiked(data.liked);
          setLikeCount(data.likeCount);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || '点赞失败');
      }
    } catch (error) {
      console.error('点赞失败:', error);
      toast.error('点赞失败');
    } finally {
      setIsLiking(false);
    }
  };

  useEffect(() => {
    async function fetchBlogDetail() {
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);

        // 获取博客详情
        const detailResponse = await fetch(`/api/blog/${slug}`);
        const detailData: BlogDetailResponse = await detailResponse.json();

        if (detailData.success) {
          setPost(detailData.data);

          // 获取相关文章
          const relatedResponse = await fetch(`/api/blog?category=${encodeURIComponent(detailData.data.category)}&limit=3`);
          const relatedData: RelatedPostsResponse = await relatedResponse.json();

          if (relatedData.success) {
            // 过滤掉当前文章
            setRelatedPosts(relatedData.data.filter(p => p.slug !== slug));
          }

          // 增加阅读量
          try {
            await fetch(`/api/blog/${slug}/view`, {
              method: 'POST',
            });
          } catch (error) {
            console.error('增加阅读量失败:', error);
          }

          // 获取点赞状态
          try {
            const likeResponse = await fetch(`/api/blog/${slug}/like`);
            if (likeResponse.ok) {
              const likeData = await likeResponse.json();
              if (likeData.success) {
                setLiked(likeData.liked);
                setLikeCount(likeData.likeCount);
              }
            }
          } catch (error) {
            console.error('获取点赞状态失败:', error);
          }
        } else {
          setError('获取博客详情失败');
        }
      } catch (err) {
        setError('网络错误，请稍后重试');
        console.error('获取博客详情失败:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBlogDetail();
  }, [slug]);

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

  if (error || !post) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 text-center">
          <p className="text-red-400">{error || '博客不存在'}</p>
          <button 
            onClick={() => router.push('/blog')}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-colors"
          >
            返回博客列表
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
        onClick={() => router.push('/blog')}
      >
        <ArrowLeft className="w-5 h-5" />
        <span>返回博客列表</span>
      </motion.button>

      {/* 博客内容 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* 分类和日期 */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-white/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>{post.category}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date(post.createdAt).toLocaleDateString('zh-CN')}</span>
          </div>
        </div>

        {/* 标题 */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
          {post.title}
        </h1>

        {/* 封面图片 */}
        {post.coverImage && (
          <div className="mb-8 rounded-xl overflow-hidden">
            <img 
              src={post.coverImage} 
              alt={post.title} 
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* 内容 */}
        <div className="prose prose-invert max-w-none mb-12">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>

        {/* 标签 */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 统计信息 */}
        <div className="flex items-center gap-6 mb-12 text-white/60">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>{post.viewCount} 阅读</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-2 ${liked ? 'text-red-400' : 'text-white/60 hover:text-white'}`}
            >
              <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              <span>{likeCount} 点赞</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>{post.commentCount} 评论</span>
          </div>
        </div>

        {/* 评论区 */}
        <BlogComments slug={slug} />
      </motion.div>

      {/* 相关文章 */}
      {relatedPosts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-3xl mx-auto mt-16"
        >
          <h2 className="text-2xl font-bold text-white mb-6">相关文章</h2>
          <div className="space-y-6">
            {relatedPosts.map((relatedPost, index) => (
              <motion.div
                key={relatedPost.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer"
                onClick={() => router.push(`/blog/${relatedPost.slug}`)}
              >
                <h3 className="text-lg font-semibold text-white mb-2 hover:text-purple-300 transition-colors">
                  {relatedPost.title}
                </h3>
                <p className="text-white/60 text-sm mb-3 line-clamp-2">
                  {relatedPost.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-white/40">
                  <span>{relatedPost.category}</span>
                  <span>{new Date(relatedPost.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
