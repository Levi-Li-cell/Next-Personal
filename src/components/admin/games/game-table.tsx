"use client";

import type { InteractiveWorkType } from "@/db/schema/game";
import { Button } from "@/components/ui/button";
import { Clock, ExternalLink, MoreHorizontal, Pencil, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Column } from "../data-table/data-table";

interface GameTableProps {
  onEdit: (game: InteractiveWorkType) => void;
  onEditTime?: (game: InteractiveWorkType) => void;
  onDelete: (game: InteractiveWorkType) => void;
  onPublish?: (game: InteractiveWorkType) => void;
}

const SCENE_TYPE_LABELS: Record<string, string> = {
  "html-game": "HTML 游戏",
  "crystal-cluster": "晶体簇",
  "wave-field": "波场",
  "torus-knot": "环面纽结",
  "orbiting-spheres": "轨道球",
  "abyssal-well": "原生 WebGL2",
};

export function getGameColumns({ onEdit, onEditTime, onDelete, onPublish }: GameTableProps): Column<InteractiveWorkType>[] {
  return [
    {
      key: "title",
      header: "游戏名称",
      cell: (game) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-medium">
            <span>{game.title}</span>
            {game.status === "published" ? (
              <span className="inline-flex items-center rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
                已发布
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                草稿
              </span>
            )}
          </div>
          <div className="max-w-xs truncate text-xs text-muted-foreground">{game.tagline || game.description?.slice(0, 50) || "无描述"}</div>
        </div>
      ),
    },
    {
      key: "sceneType",
      header: "场景类型",
      cell: (game) => SCENE_TYPE_LABELS[game.sceneType] ?? game.sceneType,
    },
    {
      key: "stats",
      header: "数据",
      cell: (game) => (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>👁 {game.viewCount}</span>
          <span>❤ {game.likeCount}</span>
          <span>💬 {game.commentCount}</span>
          {game.ratingCount > 0 && (
            <span className="text-amber-500">
              ★ {(game.ratingSum / game.ratingCount).toFixed(1)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "tags",
      header: "标签",
      cell: (game) => {
        const tags = (game.tags as string[]) || [];
        if (!tags.length) return "-";
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag) => (
              <span key={tag} className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs">
                {tag}
              </span>
            ))}
            {tags.length > 2 && <span className="text-xs text-muted-foreground">+{tags.length - 2}</span>}
          </div>
        );
      },
    },
    {
      key: "preview",
      header: "预览",
      cell: (game) => (
        <Link
          href={`/games/${game.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
        >
          查看 <ExternalLink className="h-3 w-3" />
        </Link>
      ),
    },
    {
      key: "updatedAt",
      header: "更新时间",
      cell: (game) =>
        game.updatedAt
          ? new Date(game.updatedAt).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
          : "-",
    },
    {
      key: "actions",
      header: "",
      width: "50px",
      cell: (game) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(game)}>
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            {onEditTime && (
              <DropdownMenuItem onClick={() => onEditTime(game)}>
                <Clock className="mr-2 h-4 w-4" />
                编辑时间
              </DropdownMenuItem>
            )}
            {onPublish && game.status !== "published" && (
              <DropdownMenuItem onClick={() => onPublish(game)}>
                <Send className="mr-2 h-4 w-4" />
                发布
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onDelete(game)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
