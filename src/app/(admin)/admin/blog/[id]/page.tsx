"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { BlogType } from "@/db/schema/blog";
import { BlogForm, BlogFormValues } from "@/components/admin/blog/blog-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function BlogEditPage() {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id as string;

  const [blog, setBlog] = useState<BlogType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        // 通过管理 API 获取博客（需要先实现根据 ID 获取的接口）
        const response = await fetch(`/api/admin/blog?id=${blogId}`);
        const data = await response.json();

        if (data.success && data.data) {
          // 如果返回的是列表，找到对应的博客
          const foundBlog = Array.isArray(data.data)
            ? data.data.find((b: BlogType) => b.id === blogId)
            : data.data;

          if (foundBlog) {
            setBlog(foundBlog);
          } else {
            toast.error("文章不存在");
            router.push("/admin/blog");
          }
        } else {
          // 尝试通过博客列表查找
          const listResponse = await fetch("/api/admin/blog?limit=1000&status=all");
          const listData = await listResponse.json();
          if (listData.success) {
            const foundBlog = listData.data.find((b: BlogType) => b.id === blogId);
            if (foundBlog) {
              setBlog(foundBlog);
            } else {
              toast.error("文章不存在");
              router.push("/admin/blog");
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch blog:", error);
        toast.error("获取文章信息失败");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlog();
  }, [blogId, router]);

  const handleSubmit = async (data: BlogFormValues) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/blog/${blog?.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : [],
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("文章已更新");
        router.push("/admin/blog");
      } else {
        toast.error(result.error || "更新失败");
      }
    } catch (error) {
      console.error("Failed to update blog:", error);
      toast.error("更新文章失败");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/blog">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">编辑文章</h1>
          <p className="text-muted-foreground">修改文章内容</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>文章信息</CardTitle>
        </CardHeader>
        <CardContent>
          <BlogForm blog={blog} onSubmit={handleSubmit} isLoading={isSaving} />
        </CardContent>
      </Card>
    </div>
  );
}
