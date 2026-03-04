"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
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
import { BlogType } from "@/db/schema/blog";
import { Editor } from "@tinymce/tinymce-react";

const blogFormSchema = z.object({
  title: z.string().min(1, "请输入标题"),
  slug: z.string().min(1, "请输入 URL Slug"),
  excerpt: z.string().optional(),
  content: z.string().min(1, "请输入内容"),
  coverImage: z.string().url("请输入有效的URL").optional().or(z.literal("")),
  category: z.string(),
  tags: z.string().optional(), // 逗号分隔的标签
  status: z.enum(["draft", "published"]),
});

export type BlogFormValues = z.infer<typeof blogFormSchema>;

interface BlogFormProps {
  blog?: BlogType | null;
  onSubmit: (data: BlogFormValues) => void;
  isLoading?: boolean;
}

const categories = [
  "未分类",
  "技术",
  "生活",
  "教程",
  "随笔",
  "项目",
];

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
      category: blog?.category || "未分类",
      tags: blog?.tags?.join(", ") || "",
      status: (blog?.status as "draft" | "published") || "draft",
    },
  });

  // 自动生成 slug
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
                <Textarea
                  placeholder="文章摘要（可选）"
                  className="resize-none"
                  rows={2}
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
              <div className="flex items-center justify-between">
                <FormLabel>内容 *</FormLabel>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={editorTab === "visual" ? "default" : "outline"}
                    onClick={() => setEditorTab("visual")}
                  >
                    富文本
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={editorTab === "markdown" ? "default" : "outline"}
                    onClick={() => setEditorTab("markdown")}
                  >
                    Markdown
                  </Button>
                </div>
              </div>
              <FormControl>
                {editorTab === "visual" ? (
                  <div className="border rounded-md overflow-hidden">
                    <Editor
                      licenseKey="gpl"
                      value={field.value}
                      onEditorChange={(content) => field.onChange(content)}
                      init={{
                        height: 520,
                        menubar: false,
                        plugins: [
                          "advlist",
                          "autolink",
                          "lists",
                          "link",
                          "image",
                          "charmap",
                          "preview",
                          "anchor",
                          "searchreplace",
                          "visualblocks",
                          "code",
                          "fullscreen",
                          "insertdatetime",
                          "media",
                          "table",
                          "help",
                          "wordcount",
                        ],
                        toolbar:
                          "undo redo | blocks | bold italic underline strikethrough | " +
                          "h1 h2 h3 | alignleft aligncenter alignright alignjustify | " +
                          "bullist numlist outdent indent | link image media | " +
                          "blockquote table | removeformat | code fullscreen preview",
                        images_upload_handler: async (blobInfo) => {
                          const file = blobInfo.blob();
                          const uploadFile = new File([file], blobInfo.filename(), {
                            type: file.type,
                          });
                          const uploadFormData = new FormData();
                          uploadFormData.append("file", uploadFile);
                          const response = await fetch(
                            `/api/upload?filename=${encodeURIComponent(uploadFile.name)}`,
                            {
                              method: "POST",
                              body: uploadFormData,
                            }
                          );
                          const result = await response.json();
                          if (!result.url) {
                            throw new Error(result.error || "图片上传失败");
                          }
                          return result.url as string;
                        },
                        promotion: false,
                      }}
                    />
                  </div>
                ) : (
                  <Textarea
                    placeholder="请输入文章内容（支持 Markdown）"
                    className="resize-none font-mono"
                    rows={15}
                    {...field}
                  />
                )}
              </FormControl>
              <FormDescription>支持粗体、斜体、标题、列表、图片上传与链接等常见编辑能力</FormDescription>
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
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>分类</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择分类" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
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
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>标签</FormLabel>
                <FormControl>
                  <Input placeholder="标签1, 标签2, 标签3" {...field} />
                </FormControl>
                <FormDescription>多个标签用逗号分隔</FormDescription>
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
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "保存中..." : blog ? "更新" : "创建"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
