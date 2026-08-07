"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ProjectType } from "@/db/schema/project";
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

const projectFormSchema = z.object({
  title: z.string().min(1, "请输入项目名称"),
  description: z.string().min(1, "请输入项目描述"),
  content: z.string().optional(),
  coverImage: z.string().url("请输入有效的 URL").optional().or(z.literal("")),
  techStack: z.string().optional(),
  targetAudience: z.enum(["hr", "client", "both"]),
  ctaType: z.enum(["hr", "client", "both"]),
  featured: z.boolean(),
  demoUrl: z.string().url("请输入有效的 URL").optional().or(z.literal("")),
  githubUrl: z.string().url("请输入有效的 URL").optional().or(z.literal("")),
  status: z.enum(["draft", "published"]),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  project?: ProjectType | null;
  onSubmit: (data: ProjectFormValues) => void;
  isLoading?: boolean;
}

export function ProjectForm({ project, onSubmit, isLoading }: ProjectFormProps) {
  const [editorTab, setEditorTab] = useState<"visual" | "markdown">("visual");
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: project?.title || "",
      description: project?.description || "",
      content: project?.content || "",
      coverImage: project?.coverImage || "",
      techStack: project?.techStack?.join(", ") || "",
      targetAudience: (project?.targetAudience as "hr" | "client" | "both") || "both",
      ctaType: (project?.ctaType as "hr" | "client" | "both") || "both",
      featured: Boolean(project?.featured),
      demoUrl: project?.demoUrl || "",
      githubUrl: project?.githubUrl || "",
      status: (project?.status as "draft" | "published") || "draft",
    },
  });

  useEffect(() => {
    form.reset({
      title: project?.title || "",
      description: project?.description || "",
      content: project?.content || "",
      coverImage: project?.coverImage || "",
      techStack: project?.techStack?.join(", ") || "",
      targetAudience: (project?.targetAudience as "hr" | "client" | "both") || "both",
      ctaType: (project?.ctaType as "hr" | "client" | "both") || "both",
      featured: Boolean(project?.featured),
      demoUrl: project?.demoUrl || "",
      githubUrl: project?.githubUrl || "",
      status: (project?.status as "draft" | "published") || "draft",
    });
  }, [project, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>项目名称 *</FormLabel>
              <FormControl>
                <Input placeholder="请输入项目名称" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>项目描述 *</FormLabel>
              <FormControl>
                <Textarea placeholder="简短描述项目价值和结果" className="resize-none" rows={3} {...field} />
              </FormControl>
              <FormDescription>描述会用于项目列表、首页推荐和合作入口页。</FormDescription>
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
                <FormLabel>详细介绍</FormLabel>
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
                  <RichEditor value={field.value || ""} onChange={field.onChange} placeholder="请输入项目详细介绍..." />
                ) : (
                  <Textarea placeholder="项目详细介绍（支持 Markdown）" className="resize-none font-mono" rows={10} {...field} />
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
            name="techStack"
            render={({ field }) => (
              <FormItem>
                <FormLabel>技术栈</FormLabel>
                <FormControl>
                  <Input placeholder="Next.js, TypeScript, PostgreSQL" {...field} />
                </FormControl>
                <FormDescription>多个技术用逗号分隔。</FormDescription>
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
                <FormDescription>用于不同入口页的项目推荐。</FormDescription>
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
            name="demoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>演示链接</FormLabel>
                <FormControl>
                  <Input placeholder="https://demo.example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="githubUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GitHub 链接</FormLabel>
                <FormControl>
                  <Input placeholder="https://github.com/user/repo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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

          <FormField
            control={form.control}
            name="featured"
            render={({ field }) => (
              <FormItem className="flex items-start gap-3 rounded-lg border p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel>设为精选项目</FormLabel>
                  <FormDescription>精选项目会优先出现在首页和合作入口页。</FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "保存中..." : project ? "更新" : "创建"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
