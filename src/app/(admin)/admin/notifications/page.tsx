"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface NotificationItem {
  id: string;
  userName: string;
  userEmail: string;
  eventType: string;
  title: string | null;
  content: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        unreadOnly: String(unreadOnly),
        page: "1",
        limit: "100",
      });
      const response = await fetch(`/api/admin/notifications?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        setItems(result.data);
      } else {
        toast.error(result.error || "获取通知失败");
      }
    } catch (error) {
      console.error("Fetch notifications failed:", error);
      toast.error("获取通知失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [unreadOnly]);

  const markOneRead = async (id: string) => {
    const response = await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const result = await response.json();
    if (result.success) {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
      return;
    }
    toast.error(result.error || "标记失败");
  };

  const markAllRead = async () => {
    const response = await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    const result = await response.json();
    if (result.success) {
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
      toast.success("已全部标记为已读");
      return;
    }
    toast.error(result.error || "操作失败");
  };

  const removeOne = async (id: string) => {
    const response = await fetch(`/api/admin/notifications?id=${id}`, { method: "DELETE" });
    const result = await response.json();
    if (result.success) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    toast.error(result.error || "删除失败");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">通知中心</h1>
          <p className="text-muted-foreground">查看和处理后台通知消息</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUnreadOnly((v) => !v)}>
            {unreadOnly ? "显示全部" : "仅未读"}
          </Button>
          <Button variant="outline" onClick={markAllRead}>全部已读</Button>
          <Button onClick={fetchData}>刷新</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>通知列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">加载中...</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">暂无通知</div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-md border p-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{item.userName}</div>
                    {item.title ? <div className="text-sm text-foreground truncate mt-1">{item.title}</div> : null}
                    <div className="text-sm text-muted-foreground truncate">{item.userEmail}</div>
                    {item.content ? <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.content}</div> : null}
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.eventType} · {new Date(item.createdAt).toLocaleString("zh-CN")}
                    </div>
                    {item.link ? (
                      <a href={item.link} className="text-xs text-blue-500 hover:underline mt-1 inline-block">
                        跳转链接
                      </a>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.read ? (
                      <Badge variant="secondary">已读</Badge>
                    ) : (
                      <Badge className="bg-yellow-500/20 text-yellow-700">未读</Badge>
                    )}
                    {!item.read ? (
                      <Button variant="outline" size="sm" onClick={() => markOneRead(item.id)}>
                        标记已读
                      </Button>
                    ) : null}
                    <Button variant="outline" size="sm" onClick={() => removeOne(item.id)}>
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
