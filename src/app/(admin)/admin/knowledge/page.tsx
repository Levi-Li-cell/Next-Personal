"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Database } from "lucide-react";
import { PageHeader, Toolbar, ConfirmDialog } from "@/components/admin/common";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type KnowledgeRecord = {
  id: string;
  title: string;
  content: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
};

const categoryLabels: Record<string, string> = {
  resume: "简历",
  backend: "后端能力",
  project: "项目经验",
  skill: "技能",
  general: "通用",
};

const emptyForm = {
  title: "",
  content: "",
  category: "general",
  sortOrder: "0",
  isActive: true,
};

export default function KnowledgeManagePage() {
  const [items, setItems] = useState<KnowledgeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<KnowledgeRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
        category: categoryFilter,
      });
      if (search) params.append("search", search);

      const response = await fetch(`/api/admin/knowledge?${params.toString()}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "获取失败");

      setItems(data.data);
      setPagination((current) => ({
        ...current,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      }));
    } catch (error) {
      console.error(error);
      toast.error("获取知识库失败");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, search, categoryFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: KnowledgeRecord) => {
    setEditing(item);
    setForm({
      title: item.title,
      content: item.content,
      category: item.category || "general",
      sortOrder: String(item.sortOrder ?? 0),
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("标题和内容不能为空");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };

      const response = await fetch(
        editing ? `/api/admin/knowledge/${editing.id}` : "/api/admin/knowledge",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "保存失败");

      toast.success(editing ? "已更新知识条目" : "已创建知识条目");
      setDialogOpen(false);
      fetchItems();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const response = await fetch(`/api/admin/knowledge/${deleteId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "删除失败");
      toast.success("已删除");
      setDeleteId(null);
      fetchItems();
    } catch (error) {
      console.error(error);
      toast.error("删除失败");
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const response = await fetch("/api/admin/knowledge/seed", { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "初始化失败");
      toast.success(data.message || "初始化完成");
      fetchItems();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "初始化失败");
    } finally {
      setSeeding(false);
    }
  };

  const toggleActive = async (item: KnowledgeRecord) => {
    try {
      const response = await fetch(`/api/admin/knowledge/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "更新失败");
      setItems((current) =>
        current.map((row) => (row.id === item.id ? data.data : row))
      );
      toast.success(data.data.isActive ? "已启用" : "已停用");
    } catch (error) {
      console.error(error);
      toast.error("更新状态失败");
    }
  };

  const columns: Column<KnowledgeRecord>[] = [
    {
      key: "title",
      header: "标题",
      cell: (item) => (
        <div className="space-y-1 max-w-[220px]">
          <div className="font-medium">{item.title}</div>
          <div className="text-xs text-muted-foreground line-clamp-2">{item.content}</div>
        </div>
      ),
    },
    {
      key: "category",
      header: "分类",
      cell: (item) => (
        <span className="text-sm">{categoryLabels[item.category] || item.category}</span>
      ),
    },
    {
      key: "sortOrder",
      header: "排序",
      cell: (item) => <span className="text-sm">{item.sortOrder}</span>,
    },
    {
      key: "isActive",
      header: "状态",
      cell: (item) => (
        <Button
          size="sm"
          variant={item.isActive ? "default" : "outline"}
          onClick={() => toggleActive(item)}
        >
          {item.isActive ? "启用中" : "已停用"}
        </Button>
      ),
    },
    {
      key: "updatedAt",
      header: "更新时间",
      cell: (item) => (
        <span className="text-sm text-muted-foreground">
          {item.updatedAt
            ? new Date(item.updatedAt).toLocaleString("zh-CN")
            : new Date(item.createdAt).toLocaleString("zh-CN")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "操作",
      cell: (item) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setDeleteId(item.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="知识库管理"
        description="维护 AI 客服使用的求职知识库内容，支持增删改查与启用/停用。"
        onRefresh={fetchItems}
        isLoading={isLoading}
      />

      <Toolbar
        searchPlaceholder="搜索标题或内容"
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPagination((current) => ({ ...current, pageIndex: 0 }));
        }}
        selectFilters={[
          {
            name: "分类",
            value: categoryFilter,
            options: [
              { label: "全部分类", value: "all" },
              { label: "简历", value: "resume" },
              { label: "后端能力", value: "backend" },
              { label: "项目经验", value: "project" },
              { label: "技能", value: "skill" },
              { label: "通用", value: "general" },
            ],
            onChange: (value) => {
              setCategoryFilter(value);
              setPagination((current) => ({ ...current, pageIndex: 0 }));
            },
          },
        ]}
        primaryActions={[
          {
            label: "新增条目",
            onClick: openCreate,
            icon: <Plus className="h-4 w-4" />,
          },
        ]}
        secondaryActions={[
          {
            label: seeding ? "导入中..." : "导入本地知识库",
            onClick: handleSeed,
            icon: <Database className="h-4 w-4" />,
            variant: "outline",
            loading: seeding,
            disabled: seeding,
          },
        ]}
        onRefresh={fetchItems}
        isLoading={isLoading}
      />

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => setPagination((current) => ({ ...current, pageIndex: page }))}
        emptyTitle="暂无知识库内容"
        emptyDescription="可点击「导入本地知识库」从现有 md/txt 文件初始化，或手动新增。"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "编辑知识条目" : "新增知识条目"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              value={form.title}
              onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
              placeholder="标题，例如：项目经验-台球馆系统"
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={form.category}
                onValueChange={(value) => setForm((c) => ({ ...c, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="分类" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((c) => ({ ...c, sortOrder: e.target.value }))}
                placeholder="排序（数字越小越靠前）"
              />
            </div>
            <Textarea
              value={form.content}
              onChange={(e) => setForm((c) => ({ ...c, content: e.target.value }))}
              placeholder="知识内容（AI 客服会读取）"
              className="min-h-56"
            />
            <div className="flex items-center gap-2 text-sm">
              <input
                id="knowledge-active"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((c) => ({ ...c, isActive: e.target.checked }))}
              />
              <label htmlFor="knowledge-active">启用（停用后 AI 不会读取）</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="确认删除"
        description="删除后 AI 客服将无法再使用该知识条目，此操作不可恢复。"
        onConfirm={handleDelete}
      />
    </div>
  );
}
