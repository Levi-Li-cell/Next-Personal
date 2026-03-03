"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserType } from "@/db/schema/auth/user";
import { DataTable, Column } from "@/components/admin/data-table";
import { PageHeader, ConfirmDialog } from "@/components/admin/common";
import { getUserColumns } from "@/components/admin/users/user-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <div className="space-y-6">
      <PageHeader
        title="用户管理"
        description="管理系统中的所有用户"
        onRefresh={fetchUsers}
        isLoading={isLoading}
      />

      {/* 筛选器 */}
      <div className="flex gap-4">
        <Input
          placeholder="搜索用户名或邮箱..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          className="max-w-sm"
        />
        <Select
          value={roleFilter}
          onValueChange={(value) => {
            setRoleFilter(value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="角色" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部角色</SelectItem>
            <SelectItem value="admin">管理员</SelectItem>
            <SelectItem value="member">成员</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 数据表格 */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, pageIndex: page }))}
        getRowId={(user) => user.id}
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
