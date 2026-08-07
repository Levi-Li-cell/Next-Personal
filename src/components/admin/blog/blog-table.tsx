"use client";

import { BlogType } from "@/db/schema/blog";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal, Pencil, Send, Star, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Column } from "../data-table/data-table";

interface BlogTableProps {
  onEdit: (blog: BlogType) => void;
  onDelete: (blog: BlogType) => void;
  onView?: (blog: BlogType) => void;
  onPublish?: (blog: BlogType) => void;
}

const audienceLabels: Record<string, string> = {
  both: "HR / 甲方",
  hr: "HR",
  client: "甲方",
};

export function getBlogColumns({ onEdit, onDelete, onView, onPublish }: BlogTableProps): Column<BlogType>[] {
  return [
    {
      key: "title",
      header: "标题",
      cell: (blog) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-medium">
            <span>{blog.title}</span>
            {blog.featured && <Star className="h-3.5 w-3.5 fill-current text-amber-500" />}
          </div>
          <div className="max-w-xs truncate text-xs text-muted-foreground">{blog.excerpt || "无摘要"}</div>
        </div>
      ),
    },
    {
      key: "category",
      header: "分类",
      cell: (blog) => blog.category || "未分类",
    },
    {
      key: "targetAudience",
      header: "受众",
      cell: (blog) => audienceLabels[blog.targetAudience || "both"] || "HR / 甲方",
    },
    {
      key: "status",
      header: "状态",
      cell: (blog) => (blog.status === "published" ? "已发布" : "草稿"),
    },
    {
      key: "metrics",
      header: "数据",
      cell: (blog) => (
        <div className="text-sm text-muted-foreground">
          浏览 {blog.viewCount || 0} / 点赞 {blog.likeCount || 0}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "50px",
      cell: (blog) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onView && (
              <DropdownMenuItem onClick={() => onView(blog)}>
                <Eye className="mr-2 h-4 w-4" />
                查看
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onEdit(blog)}>
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            {onPublish && blog.status !== "published" && (
              <DropdownMenuItem onClick={() => onPublish(blog)}>
                <Send className="mr-2 h-4 w-4" />
                发布
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onDelete(blog)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
