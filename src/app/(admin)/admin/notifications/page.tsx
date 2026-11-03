"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCheck, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { subscribeToAdminNotifications } from "@/lib/supabase/client";
import { useAdminNotificationStore } from "@/stores/admin-notifications";

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

const EVENT_TYPE_LABELS: Record<string, string> = {
  user_signup: "用户注册",
  guestbook_message: "留言板留言",
  blog_comment: "博客评论",
  game_comment: "游戏评论",
  game_comment_reply: "游戏回复",
  contact_lead: "线索提交",
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  /** 当前展开查看详情的通知 id（展开即“阅读”，未读会自动标记为已读） */
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 全局未读数：标记已读 / 全部已读 / 删除 / 实时到达都会同步到头部铃铛角标
  const unreadCount = useAdminNotificationStore((s) => s.unreadCount);
  const setUnreadCount = useAdminNotificationStore((s) => s.setUnreadCount);
  const decrementUnread = useAdminNotificationStore((s) => s.decrementUnread);
  const refreshUnreadCount = useAdminNotificationStore((s) => s.refreshUnreadCount);

  const fetchData = useCallback(async () => {
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
        // 以服务端为准同步未读数（覆盖任何本地乐观值）
        if (typeof result.unreadCount === "number") setUnreadCount(result.unreadCount);
      } else {
        toast.error(result.error || "获取通知失败");
      }
    } catch (error) {
      console.error("Fetch notifications failed:", error);
      toast.error("获取通知失败");
    } finally {
      setLoading(false);
    }
  }, [unreadOnly, setUnreadCount]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // 实时：新管理员通知到达时插入列表顶部（未读数由 RealtimeAdminNotification 全局 +1）
  useEffect(() => {
    const subscription = subscribeToAdminNotifications((payload) => {
      const data = payload.new;
      if (data.audience !== "admin" || data.read) return;
      setItems((prev) => [
        {
          id: data.id,
          userName: data.user_name,
          userEmail: data.user_email,
          eventType: data.event_type,
          title: data.title,
          content: data.content,
          link: data.link,
          read: false,
          createdAt: data.created_at,
        },
        ...prev,
      ]);
    });
    return () => {
      void subscription.unsubscribe();
    };
  }, []);

  /** 标记已读：乐观更新列表 + 全局未读数；失败则回滚重取 */
  const markRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    const unreadIds = new Set(items.filter((item) => ids.includes(item.id) && !item.read).map((item) => item.id));
    if (unreadIds.size === 0) return;

    setItems((prev) => {
      const next = prev.map((item) => (ids.includes(item.id) ? { ...item, read: true } : item));
      return unreadOnly ? next.filter((item) => !ids.includes(item.id)) : next;
    });
    decrementUnread(unreadIds.size);

    try {
      const response = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(unreadIds) }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "标记失败");
    } catch (error) {
      console.error("Mark notifications read failed:", error);
      toast.error("标记已读失败，已恢复原状");
      void refreshUnreadCount();
      void fetchData();
    }
  };

  /** 阅读通知：点击展开详情，未读则自动标记已读 */
  const handleItemToggle = (item: NotificationItem) => {
    const willExpand = expandedId !== item.id;
    setExpandedId(willExpand ? item.id : null);
    if (willExpand && !item.read) {
      void markRead([item.id]);
    }
  };

  const markAllRead = async () => {
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "操作失败");
      setItems((prev) => (unreadOnly ? [] : prev.map((item) => ({ ...item, read: true }))));
      setUnreadCount(0);
      toast.success("已全部标记为已读");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "操作失败");
    }
  };

  const removeOne = async (item: NotificationItem) => {
    try {
      const response = await fetch(`/api/admin/notifications?id=${item.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "删除失败");
      setItems((prev) => prev.filter((n) => n.id !== item.id));
      if (!item.read) decrementUnread(1);
      if (expandedId === item.id) setExpandedId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">通知中心</h1>
          <p className="text-muted-foreground">
            查看和处理后台通知消息
            {unreadCount > 0 ? (
              <span className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                {unreadCount} 条未读
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setUnreadOnly((v) => !v)}>
            {unreadOnly ? "显示全部" : "仅未读"}
          </Button>
          <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck className="mr-1.5 h-4 w-4" />
            全部已读
          </Button>
          <Button variant="outline" onClick={() => void fetchData()}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            刷新
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>通知列表</CardTitle>
          {unreadOnly && <Badge variant="secondary">仅未读</Badge>}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              加载中...
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {unreadOnly ? "暂无未读通知" : "暂无通知"}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const isExpanded = expandedId === item.id;
                const isUnread = !item.read;
                return (
                  <div
                    key={item.id}
                    className={`rounded-md border p-4 transition-colors ${
                      isUnread ? "border-amber-300/70 bg-amber-50/50" : "bg-card"
                    }`}
                  >
                    {/* 弹性分布：窄屏纵向堆叠，宽屏左右分栏；内容区自适应伸展，文本换行不截断 */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <button
                        type="button"
                        onClick={() => handleItemToggle(item)}
                        aria-expanded={isExpanded}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className={`font-medium ${isUnread ? "text-foreground" : "text-muted-foreground"}`}>
                            {item.userName}
                          </span>
                          {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" aria-label="未读" />}
                          <span className="text-xs text-muted-foreground">
                            {EVENT_TYPE_LABELS[item.eventType] ?? item.eventType} ·{" "}
                            {new Date(item.createdAt).toLocaleString("zh-CN")}
                          </span>
                        </div>
                        {item.title ? (
                          <div
                            className={`mt-1 text-sm font-medium break-words ${
                              isUnread ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {item.title}
                          </div>
                        ) : null}
                        <div className="mt-0.5 break-all text-xs text-muted-foreground">{item.userEmail}</div>
                        {item.content ? (
                          <div
                            className={`mt-1 text-sm text-muted-foreground ${
                              isExpanded ? "whitespace-pre-wrap break-words" : "line-clamp-2"
                            }`}
                          >
                            {item.content}
                          </div>
                        ) : null}
                      </button>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {item.link ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              if (isUnread) void markRead([item.id]);
                            }}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            查看详情
                          </a>
                        ) : null}
                        {isUnread ? (
                          <Badge className="bg-yellow-500/20 text-yellow-700">未读</Badge>
                        ) : (
                          <Badge variant="secondary">已读</Badge>
                        )}
                        {isUnread && (
                          <Button variant="outline" size="sm" onClick={() => void markRead([item.id])}>
                            标记已读
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => void removeOne(item)}>
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          删除
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
