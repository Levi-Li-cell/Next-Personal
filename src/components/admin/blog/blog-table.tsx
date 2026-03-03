"use client";

import { BlogType } from "@/db/schema/blog";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, StatusBadge, Column } from "../data-table";

interface BlogTableProps {
  onEdit: (blog: BlogType) => void;
  onDelete: (blog: BlogType) => void;
  onView?: (blog: BlogType) => void;
}

export function getBlogColumns({ onEdit, onDelete, onView }: BlogTableProps): Column<BlogType>[] {
  return [
    {
      key: "title",
      header: "标题",
      cell: (blog: BlogType) => (
        <div>
          <div className="font-medium">{blog.title}</div>
          <div className="text-xs text-muted-foreground truncate max-w-xs">
            {blog.excerpt || "无摘要"}
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "分类",
      cell: (blog: BlogType) => blog.category || "未分类",
    },
    {
      key: "status",
      header: "状态",
      cell: (blog: BlogType) => {
        const statusLabels: Record<string, { label: string; className: string }> = {
          published: { label: "已发布", className: "bg-green-100 text-green-800" },
          draft: { label: "草稿", className: "bg-gray-100 text-gray-800" },
        };
        return <StatusBadge status={blog.status} labels={statusLabels} />;
      },
    },
    {
      key: "viewCount",
      header: "浏览量",
      cell: (blog: BlogType) => blog.viewCount || 0,
    },
    {
      key: "likeCount",
      header: "点赞数",
      cell: (blog: BlogType) => blog.likeCount || 0,
    },
    {
      key: "createdAt",
      header: "创建时间",
      cell: (blog: BlogType) => formatDate(blog.createdAt),
    },
    {
      key: "actions",
      header: "",
      width: "50px",
      cell: (blog: BlogType) => (
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
            <DropdownMenuItem
              onClick={() => onDelete(blog)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
