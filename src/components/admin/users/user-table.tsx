"use client";

import { UserType } from "@/db/schema/auth/user";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, StatusBadge, Column } from "../data-table";

interface UserTableProps {
  onEdit: (user: UserType) => void;
  onDelete: (user: UserType) => void;
}

export function getUserColumns({ onEdit, onDelete }: UserTableProps): Column<UserType>[] {
  return [
    {
      key: "name",
      header: "用户名",
      cell: (user: UserType) => (
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
      cell: (user: UserType) => user.email,
    },
    {
      key: "role",
      header: "角色",
      cell: (user: UserType) => {
        const roleLabels: Record<string, { label: string; className: string }> = {
          admin: { label: "管理员", className: "bg-red-100 text-red-800" },
          member: { label: "成员", className: "bg-blue-100 text-blue-800" },
        };
        return <StatusBadge status={user.role} labels={roleLabels} />;
      },
    },
    {
      key: "registerRiskLevel",
      header: "注册风控",
      cell: (user: UserType) => {
        const riskLabels: Record<string, { label: string; className: string }> = {
          high: { label: "高风险", className: "bg-red-100 text-red-800" },
          medium: { label: "中风险", className: "bg-yellow-100 text-yellow-800" },
          low: { label: "低风险", className: "bg-green-100 text-green-800" },
        };
        return (
          <div className="space-y-1">
            <StatusBadge status={(user as UserType & { registerRiskLevel?: string | null }).registerRiskLevel || "low"} labels={riskLabels} />
            {(user as UserType & { registerIp?: string | null }).registerIp ? (
              <div className="text-xs text-muted-foreground">IP: {(user as UserType & { registerIp?: string | null }).registerIp}</div>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "emailVerified",
      header: "邮箱验证",
      cell: (user: UserType) =>
        user.emailVerified ? (
          <span className="text-green-600">已验证</span>
        ) : (
          <span className="text-muted-foreground">未验证</span>
        ),
    },
    {
      key: "createdAt",
      header: "注册时间",
      cell: (user: UserType) => formatDate(user.createdAt),
    },
    {
      key: "actions",
      header: "",
      width: "50px",
      cell: (user: UserType) => (
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
