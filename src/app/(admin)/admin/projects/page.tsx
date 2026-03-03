"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProjectType } from "@/db/schema/project";
import { DataTable, Column } from "@/components/admin/data-table";
import { PageHeader, ConfirmDialog } from "@/components/admin/common";
import { getProjectColumns } from "@/components/admin/projects/project-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function ProjectsManagePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    project: ProjectType | null;
  }>({ open: false, project: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
        status: statusFilter,
      });
      if (search) params.append("search", search);

      const response = await fetch(`/api/admin/projects?${params}`);
      const data = await response.json();

      if (data.success) {
        setProjects(data.data);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast.error("获取项目列表失败");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, search, statusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleEdit = (project: ProjectType) => {
    router.push(`/admin/projects/${project.id}`);
  };

  const handleDelete = async () => {
    if (!deleteDialog.project) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${deleteDialog.project.id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        toast.success("项目已删除");
        fetchProjects();
      } else {
        toast.error(data.error || "删除失败");
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("删除项目失败");
    } finally {
      setIsDeleting(false);
      setDeleteDialog({ open: false, project: null });
    }
  };

  const columns: Column<ProjectType>[] = [
    {
      key: "select",
      header: "",
      width: "40px",
    },
    ...getProjectColumns({
      onEdit: handleEdit,
      onDelete: (project) => setDeleteDialog({ open: true, project }),
    }),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="项目管理"
        description="管理所有展示项目"
        actionLabel="新建项目"
        onAction={() => router.push("/admin/projects/create")}
        onRefresh={fetchProjects}
        isLoading={isLoading}
      />

      {/* 筛选器 */}
      <div className="flex gap-4">
        <Input
          placeholder="搜索项目名称..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="published">已发布</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 数据表格 */}
      <DataTable
        columns={columns}
        data={projects}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, pageIndex: page }))}
        getRowId={(project) => project.id}
        emptyTitle="暂无项目"
        emptyDescription="没有找到符合条件的项目"
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, project: null })}
        title="确认删除"
        description={`确定要删除项目 "${deleteDialog.project?.title}" 吗？此操作无法撤销。`}
        confirmLabel="删除"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
