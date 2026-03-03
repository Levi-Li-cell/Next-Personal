"use client";

import { Button } from "@/components/ui/button";
import { MoreHorizontal, Check, X, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, StatusBadge, Column } from "../data-table";

interface CommentWithRelations {
  id: string;
  content: string;
  status: string;
  createdAt: Date | string;
  blogId: string;
  userId: string;
  parentId: string | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  blog: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

interface CommentTableProps {
  onApprove: (comment: CommentWithRelations) => void;
  onReject: (comment: CommentWithRelations) => void;
  onDelete: (comment: CommentWithRelations) => void;
}

export function getCommentColumns({ onApprove, onReject, onDelete }: CommentTableProps): Column<CommentWithRelations>[] {
  return [
    {
      key: "user",
      header: "用户",
      cell: (comment: CommentWithRelations) => {
        const commentUser = comment.user;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={commentUser?.image || ""} alt={commentUser?.name || ""} />
              <AvatarFallback>
                {commentUser?.name?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{commentUser?.name || "未知用户"}</span>
          </div>
        );
      },
    },
    {
      key: "content",
      header: "评论内容",
      cell: (comment: CommentWithRelations) => (
        <div className="max-w-md truncate" title={comment.content}>
          {comment.content}
        </div>
      ),
    },
    {
      key: "blog",
      header: "所属文章",
      cell: (comment: CommentWithRelations) => {
        const commentBlog = comment.blog;
        if (!commentBlog) return "-";
        return (
          <a
            href={`/blog/${commentBlog.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline truncate max-w-[150px] block"
            title={commentBlog.title}
          >
            {commentBlog.title}
          </a>
        );
      },
    },
    {
      key: "status",
      header: "状态",
      cell: (comment: CommentWithRelations) => {
        const statusLabels: Record<string, { label: string; className: string }> = {
          approved: { label: "已批准", className: "bg-green-100 text-green-800" },
          pending: { label: "待审核", className: "bg-yellow-100 text-yellow-800" },
          rejected: { label: "已拒绝", className: "bg-red-100 text-red-800" },
        };
        return <StatusBadge status={comment.status} labels={statusLabels} />;
      },
    },
    {
      key: "createdAt",
      header: "发布时间",
      cell: (comment: CommentWithRelations) => formatDate(comment.createdAt),
    },
    {
      key: "actions",
      header: "",
      width: "50px",
      cell: (comment: CommentWithRelations) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onApprove(comment)}>
              <Check className="mr-2 h-4 w-4 text-green-600" />
              批准
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onReject(comment)}>
              <X className="mr-2 h-4 w-4 text-yellow-600" />
              拒绝
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(comment)}
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

export type { CommentWithRelations };
