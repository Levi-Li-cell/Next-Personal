"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/admin/data-table";
import { PageHeader, Toolbar, ToolbarIcons } from "@/components/admin/common";

interface ChatMessageRow {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  createdAt: string;
}

export default function AdminChatPage() {
  const [rows, setRows] = useState<ChatMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
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
    const selectedMessages = rows.filter((item) => selectedIds.includes(item.id));
    const sessionIds = Array.from(new Set(selectedMessages.map((item) => item.sessionId)));

    await Promise.all(
      sessionIds.map((sessionId) =>
        fetch(`/api/admin/chat?sessionId=${encodeURIComponent(sessionId)}`, { method: "DELETE" })
      )
    );
    toast.success(`已删除 ${sessionIds.length} 个会话`);
    setSelectedRows(new Set());
    await fetchData();
  };

  const columns: Column<ChatMessageRow>[] = useMemo(
    () => [
      { key: "select", header: "", width: "40px" },
      {
        key: "sessionId",
        header: "会话ID",
        cell: (item) => <span className="text-xs text-muted-foreground break-all">{item.sessionId}</span>,
      },
      {
        key: "role",
        header: "角色",
        cell: (item) => (item.role === "assistant" ? "AI" : "用户"),
      },
      {
        key: "content",
        header: "消息内容",
        cell: (item) => <span className="line-clamp-2 text-sm">{item.content}</span>,
      },
      {
        key: "createdAt",
        header: "时间",
        cell: (item) => new Date(item.createdAt).toLocaleString("zh-CN"),
      },
      {
        key: "actions",
        header: "操作",
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
      />
    </div>
  );
}
