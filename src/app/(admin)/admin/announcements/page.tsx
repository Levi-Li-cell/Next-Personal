"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  const [editingId, setEditingId] = useState<string | null>(null);
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
      const response = await fetch("/api/admin/announcements?page=1&limit=100&status=all");
      const data = await response.json();
      if (data.success) {
        setItems(data.data || []);
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
  }, []);

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
    const response = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    const data = await response.json();
    if (data.success) {
      toast.success("公告已删除");
      await fetchItems();
      return;
    }
    toast.error(data.error || "删除失败");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">公告管理</h1>
        <p className="text-muted-foreground">创建、编辑并发布站点公告（会出现在博客列表分类中）</p>
      </div>

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

      <div className="space-y-3">
        {loading ? <div className="text-sm text-muted-foreground">加载中...</div> : null}
        {!loading && items.length === 0 ? <div className="text-sm text-muted-foreground">暂无公告</div> : null}
        {items.map((item) => (
          <div key={item.id} className="rounded-md border p-4 flex items-start justify-between gap-3">
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{item.status} · {new Date(item.createdAt).toLocaleString("zh-CN")}</div>
              {item.excerpt ? <div className="text-sm text-muted-foreground mt-2">{item.excerpt}</div> : null}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => editItem(item)}>编辑</Button>
              <Button size="sm" variant="destructive" onClick={() => removeItem(item.id)}>删除</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
