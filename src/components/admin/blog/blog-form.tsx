"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { BlogType } from "@/db/schema/blog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichEditor } from "@/components/admin/common/rich-editor";

const blogFormSchema = z.object({
  title: z.string().min(1, "请输入标题"),
  slug: z.string().min(1, "请输入 URL Slug"),
  excerpt: z.string().optional(),
  content: z.string().min(1, "请输入内容"),
  coverImage: z.string().url("请输入有效的 URL").optional().or(z.literal("")),
  category: z.string(),
  targetAudience: z.enum(["hr", "client", "both"]),
  ctaType: z.enum(["hr", "client", "both"]),
  featured: z.boolean(),
  tags: z.string().optional(),
  status: z.enum(["draft", "published"]),
});

export type BlogFormValues = z.infer<typeof blogFormSchema>;

interface BlogFormProps {
  blog?: BlogType | null;
  onSubmit: (data: BlogFormValues) => void;
  isLoading?: boolean;
}

const categories = ["生活", "公告"];

export function BlogForm({ blog, onSubmit, isLoading }: BlogFormProps) {
  const [editorTab, setEditorTab] = useState<"visual" | "markdown">("visual");
  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      title: blog?.title || "",
      slug: blog?.slug || "",
      excerpt: blog?.excerpt || "",
      content: blog?.content || "",
      coverImage: blog?.coverImage || "",
      category: blog?.category === "公告" ? "公告" : "生活",
      targetAudience: (blog?.targetAudience as "hr" | "client" | "both") || "both",
      ctaType: (blog?.ctaType as "hr" | "client" | "both") || "both",
      featured: Boolean(blog?.featured),
      tags: blog?.tags?.join(", ") || "",
      status: (blog?.status as "draft" | "published") || "draft",
    },
  });

  useEffect(() => {
    form.reset({
      title: blog?.title || "",
      slug: blog?.slug || "",
      excerpt: blog?.excerpt || "",
      content: blog?.content || "",
      coverImage: blog?.coverImage || "",
      category: blog?.category === "公告" ? "公告" : "生活",
      targetAudience: (blog?.targetAudience as "hr" | "client" | "both") || "both",
      ctaType: (blog?.ctaType as "hr" | "client" | "both") || "both",
      featured: Boolean(blog?.featured),
      tags: blog?.tags?.join(", ") || "",
      status: (blog?.status as "draft" | "published") || "draft",
    });
  }, [blog, form]);

  const generateSlug = () => {
    const title = form.getValues("title");
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "");
    form.setValue("slug", slug);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>标题 *</FormLabel>
                <FormControl>
                  <Input placeholder="请输入文章标题" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL Slug *</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input placeholder="article-url-slug" {...field} />
                  </FormControl>
                  <Button type="button" variant="outline" onClick={generateSlug}>
                    生成
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>摘要</FormLabel>
              <FormControl>
                <Textarea placeholder="文章摘要" className="resize-none" rows={2} {...field} />
              </FormControl>
              <FormDescription>摘要会用于列表页、首页推荐和分享卡片。</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>内容 *</FormLabel>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant={editorTab === "visual" ? "default" : "outline"} onClick={() => setEditorTab("visual")}>
                    富文本
                  </Button>
                  <Button type="button" size="sm" variant={editorTab === "markdown" ? "default" : "outline"} onClick={() => setEditorTab("markdown")}>
                    Markdown
                  </Button>
                </div>
              </div>
              <FormControl>
                {editorTab === "visual" ? (
                  <RichEditor value={field.value} onChange={field.onChange} placeholder="请输入文章内容..." />
                ) : (
                  <Textarea placeholder="请输入文章内容（支持 Markdown）" className="resize-none font-mono" rows={15} {...field} />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="coverImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>封面图 URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/image.jpg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>分类</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="targetAudience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>面向对象</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择面向对象" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="both">HR 与甲方</SelectItem>
                    <SelectItem value="hr">偏向 HR</SelectItem>
                    <SelectItem value="client">偏向甲方</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>用于不同入口页的内容推荐。</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ctaType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>底部 CTA</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择 CTA 类型" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="both">双入口</SelectItem>
                    <SelectItem value="hr">只显示招聘入口</SelectItem>
                    <SelectItem value="client">只显示合作入口</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>标签</FormLabel>
                <FormControl>
                  <Input placeholder="Next.js, React, 项目复盘" {...field} />
                </FormControl>
                <FormDescription>多个标签用逗号分隔。</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>状态</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="published">发布</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="featured"
          render={({ field }) => (
            <FormItem className="flex items-start gap-3 rounded-lg border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
              </FormControl>
              <div className="space-y-1">
                <FormLabel>设为精选文章</FormLabel>
                <FormDescription>精选文章会优先出现在首页和目标受众入口页。</FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "保存中..." : blog ? "更新" : "创建"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
