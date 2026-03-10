"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BlogType } from "@/db/schema/blog";
import { DataTable, Column } from "@/components/admin/data-table";
import { PageHeader, ConfirmDialog, Toolbar, ToolbarIcons } from "@/components/admin/common";
import { getBlogColumns } from "@/components/admin/blog/blog-table";
import { toast } from "sonner";

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
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    blog: BlogType | null;
  }>({ open: false, blog: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [publishDialog, setPublishDialog] = useState<{
    open: boolean;
    blog: BlogType | null;
  }>({ open: false, blog: null });
  const [isPublishing, setIsPublishing] = useState(false);

  const fetchBlogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
        status: statusFilter,
      });
      if (search) params.append("search", search);

      const response = await fetch(`/api/admin/blog?${params}`);
      const data = await response.json();

      if (data.success) {
        setBlogs(data.data);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
      toast.error("获取博客列表失败");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, search, statusFilter]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleEdit = (blog: BlogType) => {
    router.push(`/admin/blog/${blog.id}`);
  };

  const handlePublish = async () => {
    if (!publishDialog.blog) return;

    setIsPublishing(true);
    try {
      const response = await fetch(`/api/blog/${publishDialog.blog.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...publishDialog.blog,
          status: "published",
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("文章已发布");
        fetchBlogs();
      } else {
        toast.error(result.error || "发布失败");
      }
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
      const response = await fetch(`/api/blog/${deleteDialog.blog.slug}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        toast.success("博客已删除");
        fetchBlogs();
      } else {
        toast.error(data.error || "删除失败");
      }
    } catch (error) {
      console.error("Failed to delete blog:", error);
      toast.error("删除博客失败");
    } finally {
      setIsDeleting(false);
      setDeleteDialog({ open: false, blog: null });
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRows.size === 0) return;

    setIsDeleting(true);
    try {
      const selectedBlogs = blogs.filter((b) => selectedRows.has(b.id));
      const deletePromises = selectedBlogs.map((blog) =>
        fetch(`/api/blog/${blog.slug}`, { method: "DELETE" })
      );

      const results = await Promise.all(deletePromises);
      if (results.some((res) => !res.ok)) {
        throw new Error("部分删除失败");
      }
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
        const selectedBlogs = blogs.filter((b) => selectedRows.has(b.id));
        const publishPromises = selectedBlogs.map((blog) =>
          fetch(`/api/blog/${blog.slug}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...blog, status: "published" }),
          })
        );

        const results = await Promise.all(publishPromises);
        if (results.some((res) => !res.ok)) {
          throw new Error("部分发布失败");
        }

        toast.success(`已发布 ${selectedRows.size} 篇文章`);
        setSelectedRows(new Set());
        fetchBlogs();
    } catch (error) {
      console.error("Failed to batch publish blogs:", error);
      toast.error("批量发布失败");
    }
  };

  const handleExport = () => {
    if (blogs.length === 0) {
      toast.error("暂无可导出数据");
      return;
    }

    const data = blogs.map((blog) => ({
      标题: blog.title,
      分类: blog.category,
      状态: blog.status,
      浏览量: blog.viewCount,
      点赞数: blog.likeCount,
      创建时间: blog.createdAt,
    }));

    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `博客列表_${new Date().toLocaleDateString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("导出成功");
  };

  const columns: Column<BlogType>[] = [
    {
      key: "select",
      header: "",
      width: "40px",
    },
    ...getBlogColumns({
      onEdit: handleEdit,
      onDelete: (blog) => setDeleteDialog({ open: true, blog }),
      onView: (blog) => window.open(`/blog/${blog.slug}`, "_blank"),
      onPublish: (blog) => setPublishDialog({ open: true, blog }),
    }),
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="博客管理"
        description="管理所有博客文章"
      />

      {/* 工具栏 */}
      <Toolbar
        searchPlaceholder="搜索文章标题..."
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
        onRefresh={fetchBlogs}
        isLoading={isLoading}
        hasSelection={selectedRows.size > 0}
        selectedCount={selectedRows.size}
        batchActions={[
          {
            label: "发布",
            icon: ToolbarIcons.Plus,
            onClick: handleBatchPublish,
          },
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
            label: "写文章",
            icon: ToolbarIcons.Plus,
            onClick: () => router.push("/admin/blog/create"),
          },
        ]}
      />

      {/* 数据表格 */}
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
        emptyDescription="没有找到符合条件的博客文章"
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, blog: null })}
        title="确认删除"
        description={`确定要删除文章 "${deleteDialog.blog?.title}" 吗？此操作无法撤销。`}
        confirmLabel="删除"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />

      <ConfirmDialog
        open={publishDialog.open}
        onOpenChange={(open) => setPublishDialog({ open, blog: publishDialog.blog })}
        title="确认发布"
        description={`确定要发布文章 "${publishDialog.blog?.title}" 吗？发布后前台可见。`}
        confirmLabel="发布"
        onConfirm={handlePublish}
        isLoading={isPublishing}
      />
    </div>
  );
}
