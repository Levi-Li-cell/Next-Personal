"use client";

import { Button } from "@/components/ui/button";
import { MoreHorizontal, Check, X, Trash2, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, StatusBadge, Column } from "../data-table";

export interface GuestbookMessage {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  name: string;
  content: string;
  contact: string | null;
  status: string;
  createdAt: Date | string;
}

interface GuestbookTableProps {
  onApprove: (message: GuestbookMessage) => void;
  onReject: (message: GuestbookMessage) => void;
  onFlag: (message: GuestbookMessage) => void;
  onDelete: (message: GuestbookMessage) => void;
}

export function getGuestbookColumns({
  onApprove,
  onReject,
  onFlag,
  onDelete,
}: GuestbookTableProps): Column<GuestbookMessage>[] {
  return [
    {
      key: "name",
      header: "昵称",
      cell: (message: GuestbookMessage) => (
        <div>
          <div className="font-medium">{message.name}</div>
          {message.userName ? (
            <div className="text-xs text-muted-foreground">账号: {message.userName}</div>
          ) : null}
          {message.userEmail ? (
            <div className="text-xs text-muted-foreground">邮箱: {message.userEmail}</div>
          ) : null}
          {message.userId ? (
            <div className="text-xs text-muted-foreground">用户ID: {message.userId}</div>
          ) : null}
          {message.ipAddress ? (
            <div className="text-xs text-muted-foreground">IP: {message.ipAddress}</div>
          ) : null}
          {message.contact ? (
            <div className="text-xs text-muted-foreground">{message.contact}</div>
          ) : null}
        </div>
      ),
    },
    {
      key: "content",
      header: "留言内容",
      cell: (message: GuestbookMessage) => (
        <div className="max-w-md truncate" title={message.content}>
          {message.content}
        </div>
      ),
    },
    {
      key: "status",
      header: "状态",
      cell: (message: GuestbookMessage) => {
        const statusLabels: Record<string, { label: string; className: string }> = {
          approved: { label: "已展示", className: "bg-green-100 text-green-800" },
          pending: { label: "待审核", className: "bg-yellow-100 text-yellow-800" },
          rejected: { label: "已拒绝", className: "bg-red-100 text-red-800" },
          flagged: { label: "风险提醒", className: "bg-orange-100 text-orange-800" },
        };
        return <StatusBadge status={message.status} labels={statusLabels} />;
      },
    },
    {
      key: "createdAt",
      header: "提交时间",
      cell: (message: GuestbookMessage) => formatDate(message.createdAt),
    },
    {
      key: "actions",
      header: "",
      width: "50px",
      cell: (message: GuestbookMessage) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onApprove(message)}>
              <Check className="mr-2 h-4 w-4 text-green-600" />
              展示
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onReject(message)}>
              <X className="mr-2 h-4 w-4 text-yellow-600" />
              拒绝
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFlag(message)}>
              <AlertTriangle className="mr-2 h-4 w-4 text-orange-600" />
              标记风险
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(message)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
