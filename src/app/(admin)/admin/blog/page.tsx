"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BlogType } from "@/db/schema/blog";
import { DataTable, Column } from "@/components/admin/data-table";
import { PageHeader, ConfirmDialog } from "@/components/admin/common";
import { getBlogColumns } from "@/components/admin/blog/blog-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    blog: BlogType | null;
  }>({ open: false, blog: null });
  const [isDeleting, setIsDeleting] = useState(false);

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
    }),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="博客管理"
        description="管理所有博客文章"
        actionLabel="新建文章"
        onAction={() => router.push("/admin/blog/create")}
        onRefresh={fetchBlogs}
        isLoading={isLoading}
      />

      {/* 筛选器 */}
      <div className="flex gap-4">
        <Input
          placeholder="搜索文章标题..."
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
        data={blogs}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, pageIndex: page }))}
        getRowId={(blog) => blog.id}
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
    </div>
  );
}
