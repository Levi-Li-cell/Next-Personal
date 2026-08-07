"use client";

import { ProjectType } from "@/db/schema/project";
import { Button } from "@/components/ui/button";
import { ExternalLink, MoreHorizontal, Pencil, Send, Star, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Column } from "../data-table/data-table";

interface ProjectTableProps {
  onEdit: (project: ProjectType) => void;
  onDelete: (project: ProjectType) => void;
  onPublish?: (project: ProjectType) => void;
}

const audienceLabels: Record<string, string> = {
  both: "HR / 甲方",
  hr: "HR",
  client: "甲方",
};

export function getProjectColumns({ onEdit, onDelete, onPublish }: ProjectTableProps): Column<ProjectType>[] {
  return [
    {
      key: "title",
      header: "项目名称",
      cell: (project) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-medium">
            <span>{project.title}</span>
            {project.featured && <Star className="h-3.5 w-3.5 fill-current text-amber-500" />}
          </div>
          <div className="max-w-xs truncate text-xs text-muted-foreground">{project.description || "无描述"}</div>
        </div>
      ),
    },
    {
      key: "targetAudience",
      header: "受众",
      cell: (project) => audienceLabels[project.targetAudience || "both"] || "HR / 甲方",
    },
    {
      key: "techStack",
      header: "技术栈",
      cell: (project) => {
        if (!project.techStack?.length) return "-";
        return (
          <div className="flex flex-wrap gap-1">
            {project.techStack.slice(0, 3).map((tech) => (
              <span key={tech} className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs">
                {tech}
              </span>
            ))}
            {project.techStack.length > 3 && <span className="text-xs text-muted-foreground">+{project.techStack.length - 3}</span>}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "状态",
      cell: (project) => (project.status === "published" ? "已发布" : "草稿"),
    },
    {
      key: "demoUrl",
      header: "演示链接",
      cell: (project) =>
        project.demoUrl ? (
          <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
            查看 <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          "-"
        ),
    },
    {
      key: "actions",
      header: "",
      width: "50px",
      cell: (project) => (
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
            <DropdownMenuItem onClick={() => onDelete(project)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
