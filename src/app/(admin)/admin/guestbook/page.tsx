"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Column } from "@/components/admin/data-table";
import { ConfirmDialog, PageHeader, Toolbar, ToolbarIcons } from "@/components/admin/common";
import { getGuestbookColumns, GuestbookMessage } from "@/components/admin/guestbook/guestbook-table";
import { toast } from "sonner";

export default function GuestbookManagePage() {
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; message: GuestbookMessage | null }>({
    open: false,
    message: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
        status: statusFilter,
      });
      if (search) params.append("search", search);

      const response = await fetch(`/api/admin/guestbook?${params}`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.data);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      } else {
        toast.error(data.error || "获取留言失败");
      }
    } catch (error) {
      console.error("Failed to fetch guestbook messages:", error);
      toast.error("获取留言失败");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, search, statusFilter]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/guestbook/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("状态已更新");
        fetchMessages();
      } else {
        toast.error(data.error || "更新失败");
      }
    } catch (error) {
      console.error("Failed to update guestbook status:", error);
      toast.error("更新失败");
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.message) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/guestbook/${deleteDialog.message.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        toast.success("留言已删除");
        fetchMessages();
      } else {
        toast.error(data.error || "删除失败");
      }
    } catch (error) {
      console.error("Failed to delete guestbook message:", error);
      toast.error("删除失败");
    } finally {
      setIsDeleting(false);
      setDeleteDialog({ open: false, message: null });
    }
  };

  const handleBatchStatus = async (status: "approved" | "rejected" | "flagged") => {
    if (selectedRows.size === 0) return;
    try {
      await Promise.all(
        Array.from(selectedRows).map((id) =>
          fetch(`/api/admin/guestbook/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          })
        )
      );
      toast.success(`已处理 ${selectedRows.size} 条留言`);
      setSelectedRows(new Set());
      fetchMessages();
    } catch (error) {
      console.error("Failed to batch update guestbook:", error);
      toast.error("批量处理失败");
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRows.size === 0) return;
    setIsDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedRows).map((id) =>
          fetch(`/api/admin/guestbook/${id}`, { method: "DELETE" })
        )
      );
      toast.success(`已删除 ${selectedRows.size} 条留言`);
      setSelectedRows(new Set());
      fetchMessages();
    } catch (error) {
      console.error("Failed to batch delete guestbook:", error);
      toast.error("批量删除失败");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<GuestbookMessage>[] = [
    { key: "select", header: "", width: "40px" },
    ...getGuestbookColumns({
      onApprove: (message) => updateStatus(message.id, "approved"),
      onReject: (message) => updateStatus(message.id, "rejected"),
      onFlag: (message) => updateStatus(message.id, "flagged"),
      onDelete: (message) => setDeleteDialog({ open: true, message }),
    }),
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="留言板管理" description="审核与管理前台留言板内容" />

      <Toolbar
        searchPlaceholder="搜索昵称/留言内容/联系方式..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        selectFilters={[
          {
            name: "状态",
            value: statusFilter,
            options: [
              { label: "全部状态", value: "all" },
              { label: "待审核", value: "pending" },
              { label: "已展示", value: "approved" },
              { label: "风险提醒", value: "flagged" },
              { label: "已拒绝", value: "rejected" },
            ],
            onChange: (value) => {
              setStatusFilter(value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            },
          },
        ]}
        onRefresh={fetchMessages}
        isLoading={isLoading}
        hasSelection={selectedRows.size > 0}
        selectedCount={selectedRows.size}
        batchActions={[
          { label: "展示", icon: ToolbarIcons.Plus, onClick: () => handleBatchStatus("approved") },
          { label: "标记风险", icon: ToolbarIcons.Refresh, onClick: () => handleBatchStatus("flagged") },
          { label: "拒绝", icon: ToolbarIcons.Refresh, onClick: () => handleBatchStatus("rejected") },
          {
            label: "删除",
            icon: ToolbarIcons.Trash,
            onClick: handleBatchDelete,
            variant: "destructive",
            loading: isDeleting,
          },
        ]}
      />

      <DataTable
        columns={columns}
        data={messages}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, pageIndex: page }))}
        getRowId={(item) => item.id}
        selectedRows={selectedRows}
        onRowSelectionChange={setSelectedRows}
        emptyTitle="暂无留言"
        emptyDescription="没有找到符合条件的留言"
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, message: null })}
        title="确认删除"
        description="确定要删除这条留言吗？此操作无法撤销。"
        confirmLabel="删除"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
