"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProjectType } from "@/db/schema/project";
import { DataTable, Column } from "@/components/admin/data-table";
import { PageHeader, ConfirmDialog, Toolbar, ToolbarIcons } from "@/components/admin/common";
import { getProjectColumns } from "@/components/admin/projects/project-table";
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
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
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

  const handleBatchDelete = async () => {
    if (selectedRows.size === 0) return;

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedRows).map((id) =>
        fetch(`/api/projects/${id}`, { method: "DELETE" })
      );

      await Promise.all(deletePromises);
      toast.success(`已删除 ${selectedRows.size} 个项目`);
      setSelectedRows(new Set());
      fetchProjects();
    } catch (error) {
      console.error("Failed to batch delete projects:", error);
      toast.error("批量删除失败");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    const data = projects.map((project) => ({
      项目名称: project.title,
      描述: project.description,
      状态: project.status,
      技术栈: project.techStack?.join(", "),
      演示链接: project.demoUrl,
      GitHub: project.githubUrl,
      创建时间: project.createdAt,
    }));

    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `项目列表_${new Date().toLocaleDateString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("导出成功");
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
    <div className="space-y-4">
      <PageHeader
        title="项目管理"
        description="管理所有展示项目"
      />

      {/* 工具栏 */}
      <Toolbar
        searchPlaceholder="搜索项目名称..."
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
              { label: "已发布", value: "published" },
              { label: "草稿", value: "draft" },
            ],
            onChange: (value) => {
              setStatusFilter(value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            },
          },
        ]}
        onRefresh={fetchProjects}
        isLoading={isLoading}
        hasSelection={selectedRows.size > 0}
        selectedCount={selectedRows.size}
        batchActions={[
          {
            label: "删除",
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
            label: "新增项目",
            icon: ToolbarIcons.Plus,
            onClick: () => router.push("/admin/projects/create"),
          },
        ]}
      />

      {/* 数据表格 */}
      <DataTable
        columns={columns}
        data={projects}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, pageIndex: page }))}
        getRowId={(project) => project.id}
        selectedRows={selectedRows}
        onRowSelectionChange={setSelectedRows}
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
