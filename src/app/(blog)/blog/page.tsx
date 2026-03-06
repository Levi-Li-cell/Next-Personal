"use client";

import { motion } from 'motion/react';
import { BookOpen, Calendar, ArrowRight, Loader2, ArrowLeft, ChevronDown, Search, Tag, Info, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

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
  categories: string[];
}

export default function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [showMask, setShowMask] = useState(true);

  useEffect(() => {
    async function fetchBlogPosts() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (search) {
          params.append('search', search);
        }
        if (selectedCategory) {
          params.append('category', selectedCategory);
        }
        const response = await fetch(`/api/blog?${params.toString()}`);
        const data: BlogResponse = await response.json();
        
        if (data.success) {
          setBlogPosts(data.data);
          setTotalPages(data.pagination.totalPages);
          setTotal(data.pagination.total);
          if (data.categories) {
            setCategories(data.categories);
          } else {
            // 从数据中提取分类
            const uniqueCategories = [...new Set(data.data.map(post => post.category))];
            setCategories(uniqueCategories);
          }
        } else {
          setError('获取博客列表失败');
        }
      } catch (err) {
        setError('网络错误，请稍后重试');
        console.error('获取博客列表失败:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBlogPosts();
  }, [page, limit, search, selectedCategory]);

  // 分页处理
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // 每页显示数量变化
  const handleLimitChange = (newLimit: string) => {
    setLimit(parseInt(newLimit));
    setPage(1); // 重置到第一页
  };

  // 搜索处理
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // 搜索提交
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // 搜索时重置到第一页
  };

  // 分类筛选
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
    setPage(1); // 筛选时重置到第一页
  };

  // 高亮搜索结果
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark className="bg-purple-500/30 text-purple-300">$1</mark>');
  };

  return (
    <div className="container mx-auto px-6 py-12">
      {/* 科学上网提示蒙版 */}
      {showMask && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="max-w-2xl mx-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-2xl"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/20 rounded-full">
                  <Info className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">网络访问提示</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMask(false)}
                className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-white/80 mb-6 leading-relaxed">
              由于这是一次 Supabase 免费搭建的尝试，本页面的部分接口需要科学上网才能正常访问。
              如果你遇到网络错误或加载失败的情况，请确保你的网络环境能够访问国际网络，
              或者稍后再尝试刷新页面。
            </p>
            <div className="flex items-center justify-end gap-4">
              <Button
                variant="ghost"
                onClick={() => setShowMask(false)}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                我知道了
              </Button>
              <Button
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                onClick={() => setShowMask(false)}
              >
                继续浏览
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            博客文章
          </span>
        </h1>
        <p className="text-white/60 text-lg">分享技术见解与项目经验</p>
      </motion.div>

      {/* 搜索、分页和筛选 */}
      {!loading && !error && (
        <div className="flex flex-col gap-4 mb-8">
          {/* 搜索 */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
              <Input
                placeholder="搜索文章..."
                value={search}
                onChange={handleSearchChange}
                className="pl-10 bg-white/5 border-white/10"
              />
            </form>
            <div className="flex items-center gap-4">
              <div className="text-white/60 text-sm">
                显示 {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} 条，共 {total} 条
              </div>
              <Select value={limit.toString()} onValueChange={handleLimitChange}>
                <SelectTrigger className="w-32 bg-white/5 border-white/10">
                  <SelectValue placeholder="每页显示" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-white/10">
                  <SelectItem value="3">3条</SelectItem>
                  <SelectItem value="6">6条</SelectItem>
                  <SelectItem value="12">12条</SelectItem>
                  <SelectItem value="24">24条</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 分类筛选 */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Badge
                className={`cursor-pointer px-4 py-2 ${selectedCategory === '' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                onClick={() => handleCategorySelect('')}
              >
                <Tag className="w-4 h-4 mr-2 inline" />
                全部分类
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category}
                  className={`cursor-pointer px-4 py-2 ${selectedCategory === category ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                  onClick={() => handleCategorySelect(category)}
                >
                  <Tag className="w-4 h-4 mr-2 inline" />
                  {category}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
          <span className="ml-3 text-white/60">加载中...</span>
        </div>
      ) : error ? (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-colors"
          >
            重试
          </button>
        </div>
      ) : blogPosts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/60">{search || selectedCategory ? '没有找到匹配的文章' : '暂无博客文章'}</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
          {blogPosts.map((post, index) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="mb-6 block break-inside-avoid">
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer"
                whileHover={{ y: -5 }}
              >
                {post.coverImage && (
                  <div className="mb-4 rounded-lg overflow-hidden border border-white/10">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-40 object-cover"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2 text-purple-400 text-sm mb-3">
                  <BookOpen className="w-4 h-4" />
                  <span>{post.category}</span>
                </div>
                <h2 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-300 transition-colors" dangerouslySetInnerHTML={{ __html: highlightText(post.title, search) }} />
                <p className="text-white/60 text-sm mb-4 line-clamp-2" dangerouslySetInnerHTML={{ __html: highlightText(post.excerpt, search) }} />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/40 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(post.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.article>
            </Link>
          ))}
        </div>
      )}

      {/* 分页导航 */}
      {!loading && !error && totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center mt-12"
        >
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
              className="h-10 w-10 text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "ghost"}
                  onClick={() => handlePageChange(pageNum)}
                  className={
                    page === pageNum
                      ? "h-10 w-10 bg-purple-500 hover:bg-purple-600 text-white"
                      : "h-10 w-10 text-white/60 hover:text-white hover:bg-white/10"
                  }
                >
                  {pageNum}
                </Button>
              );
            })}
            {totalPages > 5 && (
              <Button
                variant="ghost"
                className="h-10 w-10 text-white/60 hover:text-white hover:bg-white/10"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              disabled={page === totalPages}
              onClick={() => handlePageChange(page + 1)}
              className="h-10 w-10 text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
