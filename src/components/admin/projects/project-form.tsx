"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectType } from "@/db/schema/project";

const projectFormSchema = z.object({
  title: z.string().min(1, "请输入项目名称"),
  description: z.string().min(1, "请输入项目描述"),
  content: z.string().optional(),
  coverImage: z.string().url("请输入有效的URL").optional().or(z.literal("")),
  techStack: z.string().optional(), // 逗号分隔
  demoUrl: z.string().url("请输入有效的URL").optional().or(z.literal("")),
  githubUrl: z.string().url("请输入有效的URL").optional().or(z.literal("")),
  status: z.enum(["draft", "published"]),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  project?: ProjectType | null;
  onSubmit: (data: ProjectFormValues) => void;
  isLoading?: boolean;
}

export function ProjectForm({ project, onSubmit, isLoading }: ProjectFormProps) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: project?.title || "",
      description: project?.description || "",
      content: project?.content || "",
      coverImage: project?.coverImage || "",
      techStack: project?.techStack?.join(", ") || "",
      demoUrl: project?.demoUrl || "",
      githubUrl: project?.githubUrl || "",
      status: (project?.status as "draft" | "published") || "draft",
    },
  });

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
                <Textarea
                  placeholder="简短描述你的项目"
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>详细介绍</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="项目的详细介绍（支持 Markdown）"
                  className="resize-none font-mono"
                  rows={10}
                  {...field}
                />
              </FormControl>
              <FormDescription>支持 Markdown 格式</FormDescription>
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
                <FormLabel>封面图片URL</FormLabel>
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
                  <Input placeholder="React, TypeScript, Node.js" {...field} />
                </FormControl>
                <FormDescription>多个技术用逗号分隔</FormDescription>
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

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>状态</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择状态" />
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

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "保存中..." : project ? "更新" : "创建"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
