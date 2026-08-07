"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProjectType } from "@/db/schema/project";
import { DataTable, Column } from "@/components/admin/data-table";
import { ConfirmDialog, PageHeader, Toolbar, ToolbarIcons } from "@/components/admin/common";
import { getProjectColumns } from "@/components/admin/projects/project-table";

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
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; project: ProjectType | null }>({ open: false, project: null });
  const [publishDialog, setPublishDialog] = useState<{ open: boolean; project: ProjectType | null }>({ open: false, project: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
        status: statusFilter,
      });
      if (search) params.append("search", search);
      if (audienceFilter !== "all") params.append("audience", audienceFilter);
      if (featuredFilter === "true") params.append("featured", "true");

      const response = await fetch(`/api/admin/projects?${params.toString()}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "获取项目失败");

      setProjects(data.data);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      }));
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast.error("获取项目列表失败");
    } finally {
      setIsLoading(false);
    }
  }, [audienceFilter, featuredFilter, pagination.pageIndex, pagination.pageSize, search, statusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handlePublish = async () => {
    if (!publishDialog.project) return;
    setIsPublishing(true);
    try {
      const response = await fetch(`/api/projects/${publishDialog.project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...publishDialog.project, status: "published" }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "发布失败");
      toast.success("项目已发布");
      fetchProjects();
    } catch (error) {
      console.error("Failed to publish project:", error);
      toast.error("发布失败");
    } finally {
      setIsPublishing(false);
      setPublishDialog({ open: false, project: null });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.project) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${deleteDialog.project.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "删除失败");
      toast.success("项目已删除");
      fetchProjects();
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
      await Promise.all(Array.from(selectedRows).map((id) => fetch(`/api/projects/${id}`, { method: "DELETE" })));
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

  const columns: Column<ProjectType>[] = [
    { key: "select", header: "", width: "40px" },
    ...getProjectColumns({
      onEdit: (project) => router.push(`/admin/projects/${project.id}`),
      onDelete: (project) => setDeleteDialog({ open: true, project }),
      onPublish: (project) => setPublishDialog({ open: true, project }),
    }),
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="项目管理" description="管理项目案例、目标受众和精选策略。" />

      <Toolbar
        searchPlaceholder="搜索项目名称或描述"
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
          {
            name: "受众",
            value: audienceFilter,
            options: [
              { label: "全部受众", value: "all" },
              { label: "HR / 甲方", value: "both" },
              { label: "HR", value: "hr" },
              { label: "甲方", value: "client" },
            ],
            onChange: (value) => {
              setAudienceFilter(value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            },
          },
          {
            name: "精选",
            value: featuredFilter,
            options: [
              { label: "全部项目", value: "all" },
              { label: "仅精选", value: "true" },
            ],
            onChange: (value) => {
              setFeaturedFilter(value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            },
          },
        ]}
        onRefresh={fetchProjects}
        isLoading={isLoading}
        hasSelection={selectedRows.size > 0}
        selectedCount={selectedRows.size}
        batchActions={[{ label: "删除", icon: ToolbarIcons.Trash, onClick: handleBatchDelete, variant: "destructive", loading: isDeleting }]}
        primaryActions={[{ label: "新增项目", icon: ToolbarIcons.Plus, onClick: () => router.push("/admin/projects/create") }]}
      />

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
        emptyDescription="还没有符合条件的项目。"
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, project: open ? deleteDialog.project : null })}
        title="确认删除"
        description={`确定要删除项目“${deleteDialog.project?.title || ""}”吗？此操作无法撤销。`}
        confirmLabel="删除"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />

      <ConfirmDialog
        open={publishDialog.open}
        onOpenChange={(open) => setPublishDialog({ open, project: publishDialog.project })}
        title="确认发布"
        description={`确定要发布项目“${publishDialog.project?.title || ""}”吗？发布后前台可见。`}
        confirmLabel="发布"
        onConfirm={handlePublish}
        isLoading={isPublishing}
      />
    </div>
  );
}
