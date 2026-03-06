"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, type Column } from "@/components/admin/data-table";
import { PageHeader, Toolbar, ToolbarIcons } from "@/components/admin/common";

interface AnnouncementItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  status: string;
  createdAt: string;
}

export default function AdminAnnouncementsPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    coverImage: "",
    status: "published",
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
        status: statusFilter,
      });
      if (search) {
        params.set("search", search);
      }

      const response = await fetch(`/api/admin/announcements?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setItems(data.data || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
        }));
      } else {
        toast.error(data.error || "获取公告失败");
      }
    } catch (error) {
      console.error("fetch announcements failed:", error);
      toast.error("获取公告失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [pagination.pageIndex, pagination.pageSize, search, statusFilter]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ title: "", excerpt: "", content: "", coverImage: "", status: "published" });
  };

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("标题和内容不能为空");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const response = await fetch(`/api/admin/announcements/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await response.json();
        if (!data.success) {
          toast.error(data.error || "更新失败");
          return;
        }
        toast.success("公告已更新");
      } else {
        const response = await fetch("/api/admin/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            authorId: session?.user?.id,
          }),
        });
        const data = await response.json();
        if (!data.success) {
          toast.error(data.error || "创建失败");
          return;
        }
        toast.success("公告已发布");
      }
      resetForm();
      await fetchItems();
    } catch (error) {
      console.error("save announcement failed:", error);
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const editItem = (item: AnnouncementItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      excerpt: item.excerpt || "",
      content: item.content,
      coverImage: item.coverImage || "",
      status: item.status,
    });
  };

  const removeItem = async (id: string) => {
    setDeleting(true);
    const response = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    const data = await response.json();
    if (data.success) {
      toast.success("公告已删除");
      await fetchItems();
      setDeleting(false);
      return;
    }
    setDeleting(false);
    toast.error(data.error || "删除失败");
  };

  const batchDelete = async () => {
    if (selectedRows.size === 0) {
      return;
    }

    setDeleting(true);
    try {
      await Promise.all(Array.from(selectedRows).map((id) => fetch(`/api/admin/announcements/${id}`, { method: "DELETE" })));
      toast.success(`已删除 ${selectedRows.size} 条公告`);
      setSelectedRows(new Set());
      await fetchItems();
    } catch (error) {
      console.error("batch delete failed:", error);
      toast.error("批量删除失败");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<AnnouncementItem>[] = [
    { key: "select", header: "", width: "40px" },
    {
      key: "title",
      header: "标题",
      cell: (item) => (
        <div>
          <div className="font-medium">{item.title}</div>
          <div className="text-xs text-muted-foreground">{item.slug}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "状态",
      cell: (item) => (item.status === "published" ? "已发布" : "草稿"),
    },
    {
      key: "createdAt",
      header: "创建时间",
      cell: (item) => new Date(item.createdAt).toLocaleString("zh-CN"),
    },
    {
      key: "actions",
      header: "操作",
      cell: (item) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => editItem(item)}>编辑</Button>
          <Button size="sm" variant="destructive" onClick={() => removeItem(item.id)}>删除</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="公告管理"
        description="创建、编辑并发布站点公告（会出现在博客列表分类中）"
      />

      <Toolbar
        searchPlaceholder="搜索公告标题..."
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
        onRefresh={fetchItems}
        isLoading={loading}
        hasSelection={selectedRows.size > 0}
        selectedCount={selectedRows.size}
        batchActions={[
          {
            label: "删除",
            icon: ToolbarIcons.Trash,
            onClick: batchDelete,
            variant: "destructive",
            loading: deleting,
          },
        ]}
      />

      <div className="grid gap-3 rounded-lg border p-4">
        <Input placeholder="公告标题" value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} />
        <Input placeholder="摘要（可选）" value={form.excerpt} onChange={(e) => setForm((v) => ({ ...v, excerpt: e.target.value }))} />
        <Input placeholder="封面链接（可选）" value={form.coverImage} onChange={(e) => setForm((v) => ({ ...v, coverImage: e.target.value }))} />
        <Textarea rows={8} placeholder="公告内容" value={form.content} onChange={(e) => setForm((v) => ({ ...v, content: e.target.value }))} />
        <div className="flex gap-2">
          <Button onClick={submit} disabled={saving}>{editingId ? "更新公告" : "发布公告"}</Button>
          {editingId ? <Button variant="outline" onClick={resetForm}>取消编辑</Button> : null}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        isLoading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, pageIndex: page }))}
        getRowId={(item) => item.id}
        selectedRows={selectedRows}
        onRowSelectionChange={setSelectedRows}
        emptyTitle="暂无公告"
        emptyDescription="没有找到符合条件的公告"
      />
    </div>
  );
}
