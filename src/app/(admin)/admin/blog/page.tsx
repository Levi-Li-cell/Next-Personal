"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BlogType } from "@/db/schema/blog";
import { DataTable, Column } from "@/components/admin/data-table";
import { ConfirmDialog, PageHeader, Toolbar, ToolbarIcons } from "@/components/admin/common";
import { getBlogColumns } from "@/components/admin/blog/blog-table";

export default function BlogManagePage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogType[]>([]);
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
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; blog: BlogType | null }>({ open: false, blog: null });
  const [publishDialog, setPublishDialog] = useState<{ open: boolean; blog: BlogType | null }>({ open: false, blog: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const fetchBlogs = useCallback(async () => {
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

      const response = await fetch(`/api/admin/blog?${params.toString()}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "获取博客失败");

      setBlogs(data.data);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      }));
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
      toast.error("获取博客列表失败");
    } finally {
      setIsLoading(false);
    }
  }, [audienceFilter, featuredFilter, pagination.pageIndex, pagination.pageSize, search, statusFilter]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handlePublish = async () => {
    if (!publishDialog.blog) return;
    setIsPublishing(true);
    try {
      const response = await fetch(`/api/blog/${publishDialog.blog.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...publishDialog.blog, status: "published" }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "发布失败");
      toast.success("文章已发布");
      fetchBlogs();
    } catch (error) {
      console.error("Failed to publish blog:", error);
      toast.error("发布失败");
    } finally {
      setIsPublishing(false);
      setPublishDialog({ open: false, blog: null });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.blog) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/blog/${deleteDialog.blog.slug}`, { method: "DELETE" });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "删除失败");
      toast.success("文章已删除");
      fetchBlogs();
    } catch (error) {
      console.error("Failed to delete blog:", error);
      toast.error("删除文章失败");
    } finally {
      setIsDeleting(false);
      setDeleteDialog({ open: false, blog: null });
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRows.size === 0) return;
    setIsDeleting(true);
    try {
      await Promise.all(blogs.filter((item) => selectedRows.has(item.id)).map((item) => fetch(`/api/blog/${item.slug}`, { method: "DELETE" })));
      toast.success(`已删除 ${selectedRows.size} 篇文章`);
      setSelectedRows(new Set());
      fetchBlogs();
    } catch (error) {
      console.error("Failed to batch delete blogs:", error);
      toast.error("批量删除失败");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBatchPublish = async () => {
    if (selectedRows.size === 0) return;
    try {
      await Promise.all(
        blogs
          .filter((item) => selectedRows.has(item.id))
          .map((item) =>
            fetch(`/api/blog/${item.slug}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...item, status: "published" }),
            })
          )
      );
      toast.success(`已发布 ${selectedRows.size} 篇文章`);
      setSelectedRows(new Set());
      fetchBlogs();
    } catch (error) {
      console.error("Failed to batch publish blogs:", error);
      toast.error("批量发布失败");
    }
  };

  const columns: Column<BlogType>[] = [
    { key: "select", header: "", width: "40px" },
    ...getBlogColumns({
      onEdit: (blog) => router.push(`/admin/blog/${blog.id}`),
      onDelete: (blog) => setDeleteDialog({ open: true, blog }),
      onView: (blog) => window.open(`/blog/${blog.slug}`, "_blank"),
      onPublish: (blog) => setPublishDialog({ open: true, blog }),
    }),
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="博客管理" description="管理文章内容、受众方向和精选策略。" />

      <Toolbar
        searchPlaceholder="搜索文章标题或摘要"
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
              { label: "全部文章", value: "all" },
              { label: "仅精选", value: "true" },
            ],
            onChange: (value) => {
              setFeaturedFilter(value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            },
          },
        ]}
        onRefresh={fetchBlogs}
        isLoading={isLoading}
        hasSelection={selectedRows.size > 0}
        selectedCount={selectedRows.size}
        batchActions={[
          { label: "发布", icon: ToolbarIcons.Plus, onClick: handleBatchPublish },
          { label: "删除", icon: ToolbarIcons.Trash, onClick: handleBatchDelete, variant: "destructive", loading: isDeleting },
        ]}
        primaryActions={[{ label: "写文章", icon: ToolbarIcons.Plus, onClick: () => router.push("/admin/blog/create") }]}
      />

      <DataTable
        columns={columns}
        data={blogs}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, pageIndex: page }))}
        getRowId={(blog) => blog.id}
        selectedRows={selectedRows}
        onRowSelectionChange={setSelectedRows}
        emptyTitle="暂无文章"
        emptyDescription="还没有符合条件的文章。"
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, blog: open ? deleteDialog.blog : null })}
        title="确认删除"
        description={`确定要删除文章“${deleteDialog.blog?.title || ""}”吗？此操作无法撤销。`}
        confirmLabel="删除"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />

      <ConfirmDialog
        open={publishDialog.open}
        onOpenChange={(open) => setPublishDialog({ open, blog: publishDialog.blog })}
        title="确认发布"
        description={`确定要发布文章“${publishDialog.blog?.title || ""}”吗？发布后前台可见。`}
        confirmLabel="发布"
        onConfirm={handlePublish}
        isLoading={isPublishing}
      />
    </div>
  );
}
