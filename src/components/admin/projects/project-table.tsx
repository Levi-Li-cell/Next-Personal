"use client";

import { ProjectType } from "@/db/schema/project";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, ExternalLink, Send } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, StatusBadge, Column } from "../data-table";

interface ProjectTableProps {
  onEdit: (project: ProjectType) => void;
  onDelete: (project: ProjectType) => void;
  onPublish?: (project: ProjectType) => void;
}

export function getProjectColumns({ onEdit, onDelete, onPublish }: ProjectTableProps): Column<ProjectType>[] {
  return [
    {
      key: "coverImage",
      header: "封面",
      cell: (project: ProjectType) => (
        <div className="space-y-2">
          {project.coverImage ? (
            <img
              src={project.coverImage}
              alt={project.title}
              className="h-12 w-20 rounded-md object-cover border"
            />
          ) : (
            <div className="h-12 w-20 rounded-md border bg-muted/40 text-xs text-muted-foreground flex items-center justify-center">
              无封面
            </div>
          )}
          <div className="max-w-[220px] text-xs text-muted-foreground break-all">
            {project.coverImage ? (
              <a
                href={project.coverImage}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                title={project.coverImage}
              >
                {project.coverImage}
              </a>
            ) : (
              "-"
            )}
          </div>
        </div>
      ),
    },
    {
      key: "title",
      header: "项目名称",
      cell: (project: ProjectType) => (
        <div>
          <div className="font-medium">{project.title}</div>
          <div className="text-xs text-muted-foreground truncate max-w-xs">
            {project.description || "无描述"}
          </div>
        </div>
      ),
    },
    {
      key: "techStack",
      header: "技术栈",
      cell: (project: ProjectType) => {
        const techStack = project.techStack;
        if (!techStack || techStack.length === 0) return "-";
        return (
          <div className="flex flex-wrap gap-1">
            {techStack.slice(0, 3).map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs"
              >
                {tech}
              </span>
            ))}
            {techStack.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{techStack.length - 3}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "状态",
      cell: (project: ProjectType) => {
        const statusLabels: Record<string, { label: string; className: string }> = {
          published: { label: "已发布", className: "bg-green-100 text-green-800" },
          draft: { label: "草稿", className: "bg-gray-100 text-gray-800" },
        };
        return <StatusBadge status={project.status} labels={statusLabels} />;
      },
    },
    {
      key: "demoUrl",
      header: "演示链接",
      cell: (project: ProjectType) => {
        if (!project.demoUrl) return "-";
        return (
          <a
            href={project.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            查看 <ExternalLink className="h-3 w-3" />
          </a>
        );
      },
    },
    {
      key: "createdAt",
      header: "创建时间",
      cell: (project: ProjectType) => formatDate(project.createdAt),
    },
    {
      key: "actions",
      header: "",
      width: "50px",
      cell: (project: ProjectType) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(project)}>
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            {onPublish && project.status !== "published" && (
              <DropdownMenuItem onClick={() => onPublish(project)}>
                <Send className="mr-2 h-4 w-4" />
                发布
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onDelete(project)}
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
