"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserType } from "@/db/schema/auth/user";
import { DataTable, Column } from "@/components/admin/data-table";
import { PageHeader, ConfirmDialog, Toolbar, ToolbarIcons } from "@/components/admin/common";
import { getUserColumns } from "@/components/admin/users/user-table";
import { toast } from "sonner";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user: UserType | null;
  }>({ open: false, user: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
      });
      if (search) params.append("search", search);
      if (roleFilter !== "all") params.append("role", roleFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("获取用户列表失败");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEdit = (user: UserType) => {
    router.push(`/admin/users/${user.id}`);
  };

  const handleDelete = async () => {
    if (!deleteDialog.user) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${deleteDialog.user.id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        toast.success("用户已删除");
        fetchUsers();
      } else {
        toast.error(data.error || "删除失败");
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("删除用户失败");
    } finally {
      setIsDeleting(false);
      setDeleteDialog({ open: false, user: null });
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRows.size === 0) return;

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedRows).map((id) =>
        fetch(`/api/admin/users/${id}`, { method: "DELETE" })
      );

      await Promise.all(deletePromises);
      toast.success(`已删除 ${selectedRows.size} 个用户`);
      setSelectedRows(new Set());
      fetchUsers();
    } catch (error) {
      console.error("Failed to batch delete users:", error);
      toast.error("批量删除失败");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    const data = users.map((user) => ({
      用户名: user.name,
      邮箱: user.email,
      角色: user.role,
      注册时间: user.createdAt,
    }));

    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `用户列表_${new Date().toLocaleDateString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("导出成功");
  };

  const columns: Column<UserType>[] = [
    {
      key: "select",
      header: "",
      width: "40px",
    },
    ...getUserColumns({
      onEdit: handleEdit,
      onDelete: (user: UserType) => setDeleteDialog({ open: true, user }),
    }),
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="用户管理"
        description="管理系统中的所有用户"
      />

      {/* 工具栏 */}
      <Toolbar
        searchPlaceholder="搜索用户名或邮箱..."
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
              { label: "管理员", value: "admin" },
              { label: "成员", value: "member" },
            ],
            onChange: (value) => {
              setRoleFilter(value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            },
          },
        ]}
        onRefresh={fetchUsers}
        isLoading={isLoading}
        hasSelection={selectedRows.size > 0}
        selectedCount={selectedRows.size}
        batchActions={[
          {
            label: "批量删除",
            icon: ToolbarIcons.Trash,
            onClick: handleBatchDelete,
            variant: "destructive",
            loading: isDeleting,
          },
        ]}
        secondaryActions={[
          {
            label: "导出",
            icon: ToolbarIcons.Download,
            onClick: handleExport,
          },
        ]}
        primaryActions={[
          {
            label: "新增用户",
            icon: ToolbarIcons.Plus,
            onClick: () => router.push("/admin/users/create"),
          },
        ]}
      />

      {/* 数据表格 */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, pageIndex: page }))}
        getRowId={(user) => user.id}
        selectedRows={selectedRows}
        onRowSelectionChange={setSelectedRows}
        emptyTitle="暂无用户"
        emptyDescription="没有找到符合条件的用户"
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, user: null })}
        title="确认删除"
        description={`确定要删除用户 "${deleteDialog.user?.name}" 吗？此操作无法撤销。`}
        confirmLabel="删除"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
