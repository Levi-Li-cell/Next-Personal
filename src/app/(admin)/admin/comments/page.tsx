"use client";

import { useEffect, useState, useCallback } from "react";
import { DataTable, Column } from "@/components/admin/data-table";
import { PageHeader, ConfirmDialog, Toolbar, ToolbarIcons } from "@/components/admin/common";
import { getCommentColumns, CommentWithRelations } from "@/components/admin/comments/comment-table";
import { toast } from "sonner";

export default function CommentsManagePage() {
  const [comments, setComments] = useState<CommentWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    comment: CommentWithRelations | null;
  }>({ open: false, comment: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
        status: statusFilter,
      });
      if (search) params.append("search", search);

      const response = await fetch(`/api/admin/comments?${params}`);
      const data = await response.json();

      if (data.success) {
        setComments(data.data);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      toast.error("获取评论列表失败");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, search, statusFilter]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const updateCommentStatus = async (commentId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("状态已更新");
        fetchComments();
      } else {
        toast.error(data.error || "更新失败");
      }
    } catch (error) {
      console.error("Failed to update comment:", error);
      toast.error("更新状态失败");
    }
  };

  const handleApprove = (comment: CommentWithRelations) => {
    updateCommentStatus(comment.id, "approved");
  };

  const handleReject = (comment: CommentWithRelations) => {
    updateCommentStatus(comment.id, "rejected");
  };

  const handleDelete = async () => {
    if (!deleteDialog.comment) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/comments/${deleteDialog.comment.id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        toast.success("评论已删除");
        fetchComments();
      } else {
        toast.error(data.error || "删除失败");
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error("删除评论失败");
    } finally {
      setIsDeleting(false);
      setDeleteDialog({ open: false, comment: null });
    }
  };

  const handleBatchApprove = async () => {
    if (selectedRows.size === 0) return;

    try {
      const updatePromises = Array.from(selectedRows).map((id) =>
        fetch(`/api/admin/comments/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "approved" }),
        })
      );

      await Promise.all(updatePromises);
      toast.success(`已批准 ${selectedRows.size} 条评论`);
      setSelectedRows(new Set());
      fetchComments();
    } catch (error) {
      console.error("Failed to batch approve comments:", error);
      toast.error("批量批准失败");
    }
  };

  const handleBatchReject = async () => {
    if (selectedRows.size === 0) return;

    try {
      const updatePromises = Array.from(selectedRows).map((id) =>
        fetch(`/api/admin/comments/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "rejected" }),
        })
      );

      await Promise.all(updatePromises);
      toast.success(`已拒绝 ${selectedRows.size} 条评论`);
      setSelectedRows(new Set());
      fetchComments();
    } catch (error) {
      console.error("Failed to batch reject comments:", error);
      toast.error("批量拒绝失败");
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRows.size === 0) return;

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedRows).map((id) =>
        fetch(`/api/admin/comments/${id}`, { method: "DELETE" })
      );

      await Promise.all(deletePromises);
      toast.success(`已删除 ${selectedRows.size} 条评论`);
      setSelectedRows(new Set());
      fetchComments();
    } catch (error) {
      console.error("Failed to batch delete comments:", error);
      toast.error("批量删除失败");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<CommentWithRelations>[] = [
    {
      key: "select",
      header: "",
      width: "40px",
    },
    ...getCommentColumns({
      onApprove: handleApprove,
      onReject: handleReject,
      onDelete: (comment) => setDeleteDialog({ open: true, comment }),
    }),
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="评论管理"
        description="审核和管理用户评论"
      />

      {/* 工具栏 */}
      <Toolbar
        searchPlaceholder="搜索评论内容..."
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
              { label: "已批准", value: "approved" },
              { label: "已拒绝", value: "rejected" },
            ],
            onChange: (value) => {
              setStatusFilter(value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            },
          },
        ]}
        onRefresh={fetchComments}
        isLoading={isLoading}
        hasSelection={selectedRows.size > 0}
        selectedCount={selectedRows.size}
        batchActions={[
          {
            label: "批准",
            icon: ToolbarIcons.Plus,
            onClick: handleBatchApprove,
          },
          {
            label: "拒绝",
            icon: ToolbarIcons.Refresh,
            onClick: handleBatchReject,
          },
          {
            label: "删除",
            icon: ToolbarIcons.Trash,
            onClick: handleBatchDelete,
            variant: "destructive",
            loading: isDeleting,
          },
        ]}
      />

      {/* 数据表格 */}
      <DataTable
        columns={columns}
        data={comments}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, pageIndex: page }))}
        getRowId={(comment) => comment.id}
        selectedRows={selectedRows}
        onRowSelectionChange={setSelectedRows}
        emptyTitle="暂无评论"
        emptyDescription="没有找到符合条件的评论"
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, comment: null })}
        title="确认删除"
        description="确定要删除这条评论吗？此操作无法撤销。"
        confirmLabel="删除"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
