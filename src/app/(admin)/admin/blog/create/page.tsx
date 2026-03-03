"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BlogForm, BlogFormValues } from "@/components/admin/blog/blog-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function BlogCreatePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [authorId, setAuthorId] = useState<string>("");

  useEffect(() => {
    // 从 localStorage 获取用户信息
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setAuthorId(user.id);
    }
  }, []);

  const handleSubmit = async (data: BlogFormValues) => {
    if (!authorId) {
      toast.error("请先登录");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : [],
          authorId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("文章创建成功");
        router.push("/admin/blog");
      } else {
        toast.error(result.error || "创建失败");
      }
    } catch (error) {
      console.error("Failed to create blog:", error);
      toast.error("创建文章失败");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/blog">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">创建文章</h1>
          <p className="text-muted-foreground">撰写新的博客文章</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>文章信息</CardTitle>
        </CardHeader>
        <CardContent>
          <BlogForm onSubmit={handleSubmit} isLoading={isSaving} />
        </CardContent>
      </Card>
    </div>
  );
}
