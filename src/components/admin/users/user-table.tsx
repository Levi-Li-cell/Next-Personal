"use client";

import { User } from "@/db/schema/auth/user";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, StatusBadge, Column } from "../data-table";

interface UserTableProps {
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export function getUserColumns({ onEdit, onDelete }: UserTableProps): Column<User>[] {
  return [
    {
      key: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          用户名
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: (user: User) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image || ""} alt={user.name} />
            <AvatarFallback>{user.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-xs text-muted-foreground">@{user.username || "N/A"}</div>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "邮箱",
      cell: (user: User) => user.email,
    },
    {
      key: "role",
      header: "角色",
      cell: (user: User) => {
        const roleLabels: Record<string, { label: string; className: string }> = {
          admin: { label: "管理员", className: "bg-red-100 text-red-800" },
          member: { label: "成员", className: "bg-blue-100 text-blue-800" },
        };
        return <StatusBadge status={user.role} labels={roleLabels} />;
      },
    },
    {
      key: "emailVerified",
      header: "邮箱验证",
      cell: (user: User) =>
        user.emailVerified ? (
          <span className="text-green-600">已验证</span>
        ) : (
          <span className="text-muted-foreground">未验证</span>
        ),
    },
    {
      key: "createdAt",
      header: "注册时间",
      cell: (user: User) => formatDate(user.createdAt),
    },
    {
      key: "actions",
      header: "",
      width: "50px",
      cell: (user: User) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(user)}>
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(user)}
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
