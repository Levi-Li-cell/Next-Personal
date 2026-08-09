"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/admin/data-table";
import { PageHeader, Toolbar, ToolbarIcons } from "@/components/admin/common";

interface TurnMessage {
  role: string;
  content: string;
  createdAt: string;
}

interface ConversationTurn {
  id: string;
  sessionId: string;
  /** 提问时间（用户首条消息时间） */
  questionTime: string;
  /** 该轮次下的全部消息，user 在前 assistant 在后 */
  messages: TurnMessage[];
  /** 缩略预览 */
  preview: string;
  messageCount: number;
}

export default function AdminChatPage() {
  const [rows, setRows] = useState<ConversationTurn[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [detailTurn, setDetailTurn] = useState<ConversationTurn | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
        role: roleFilter,
      });
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(`/api/admin/chat?${params.toString()}`);
      const result = await response.json();
      if (!result?.success) {
        toast.error(result?.error || "获取AI聊天记录失败");
        return;
      }

      setRows(result.data || []);
      setPagination((prev) => ({
        ...prev,
        total: result.pagination?.total || 0,
        totalPages: result.pagination?.totalPages || 0,
      }));
    } catch (error) {
      console.error("fetch admin chat failed:", error);
      toast.error("获取AI聊天记录失败");
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, roleFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const deleteSession = async (sessionId: string) => {
    const response = await fetch(`/api/admin/chat?sessionId=${encodeURIComponent(sessionId)}`, { method: "DELETE" });
    const result = await response.json();
    if (!result?.success) {
      toast.error(result?.error || "删除会话失败");
      return;
    }
    toast.success("会话已删除");
    await fetchData();
  };

  const batchDeleteSessions = async () => {
    if (selectedRows.size === 0) {
      return;
    }

    const selectedIds = Array.from(selectedRows);
    const selectedTurns = rows.filter((item) => selectedIds.includes(item.id));
    const sessionIds = Array.from(new Set(selectedTurns.map((item) => item.sessionId)));

    await Promise.all(
      sessionIds.map((sessionId) =>
        fetch(`/api/admin/chat?sessionId=${encodeURIComponent(sessionId)}`, { method: "DELETE" })
      )
    );
    toast.success(`已删除 ${sessionIds.length} 个会话`);
    setSelectedRows(new Set());
    await fetchData();
  };

  const columns: Column<ConversationTurn>[] = useMemo(
    () => [
      { key: "select", header: "", width: "44px" },
      {
        key: "sessionId",
        header: "会话ID",
        width: "16%",
        cell: (item) => (
          <span className="text-xs text-muted-foreground break-all leading-tight">{item.sessionId}</span>
        ),
      },
      {
        key: "questionTime",
        header: "提问时间",
        width: "150px",
        cell: (item) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {new Date(item.questionTime).toLocaleString("zh-CN")}
          </span>
        ),
      },
      {
        key: "conversation",
        header: "对话内容",
        cell: (item) => (
          <div className="flex flex-col gap-1.5">
            <span className="line-clamp-2 text-sm leading-snug whitespace-pre-wrap break-words text-foreground/90">
              {item.preview}
            </span>
            <Button
              size="sm"
              variant="link"
              className="h-auto p-0 w-fit text-xs"
              onClick={() => setDetailTurn(item)}
            >
              查看完整对话（{item.messageCount} 条）
            </Button>
          </div>
        ),
      },
      {
        key: "actions",
        header: "操作",
        width: "96px",
        cell: (item) => (
          <Button size="sm" variant="destructive" onClick={() => deleteSession(item.sessionId)}>
            删除会话
          </Button>
        ),
      },
    ],
    [rows]
  );

  return (
    <div className="space-y-4">
      <PageHeader title="AI客服消息管理" description="查看并管理 AI 智能客服消息记录" />

      <Toolbar
        searchPlaceholder="搜索会话ID或消息内容"
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        selectFilters={[
          {
            name: "角色",
            value: roleFilter,
            options: [
              { label: "全部角色", value: "all" },
              { label: "用户", value: "user" },
              { label: "AI", value: "assistant" },
            ],
            onChange: (value) => {
              setRoleFilter(value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            },
          },
        ]}
        onRefresh={fetchData}
        isLoading={loading}
        hasSelection={selectedRows.size > 0}
        selectedCount={selectedRows.size}
        batchActions={[
          {
            label: "删除会话",
            icon: ToolbarIcons.Trash,
            onClick: batchDeleteSessions,
            variant: "destructive",
          },
        ]}
      />

      <DataTable
        columns={columns}
        data={rows}
        isLoading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, pageIndex: page }))}
        selectedRows={selectedRows}
        onRowSelectionChange={setSelectedRows}
        getRowId={(item) => item.id}
        emptyTitle="暂无客服消息"
        emptyDescription="AI客服历史消息会展示在这里"
        fixedLayout
      />

      <Dialog open={!!detailTurn} onOpenChange={(open) => !open && setDetailTurn(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>对话详情</DialogTitle>
            <DialogDescription>
              会话 ID：{detailTurn?.sessionId} · 提问时间：
              {detailTurn ? new Date(detailTurn.questionTime).toLocaleString("zh-CN") : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {detailTurn?.messages.map((m, idx) => (
              <div
                key={idx}
                className={`rounded-lg border p-3 ${
                  m.role === "user"
                    ? "bg-blue-50/50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900"
                    : "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {m.role === "user" ? "用户" : "AI"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(m.createdAt).toLocaleString("zh-CN")}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                  {m.content}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
