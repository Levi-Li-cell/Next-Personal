"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, BellRing, Megaphone } from "lucide-react";
import { motion } from "motion/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { subscribeToAdminNotifications, type AdminNotificationRealtimePayload } from "@/lib/supabase/client";
import { useSession } from "@/lib/auth/client";

interface FrontNotification {
  id: string;
  eventType: string;
  title: string;
  content: string;
  link: string | null;
  createdAt: string;
}

const eventTitleMap: Record<string, string> = {
  announcement: "站点公告",
  blog_published: "新博客上线",
  project_published: "新项目上线",
};

function toFrontNotification(item: {
  id: string;
  eventType: string;
  title: string | null;
  content: string | null;
  link: string | null;
  createdAt: string;
}): FrontNotification {
  return {
    id: item.id,
    eventType: item.eventType,
    title: item.title || eventTitleMap[item.eventType] || "最新消息",
    content: item.content || "点击查看详情",
    link: item.link || null,
    createdAt: item.createdAt,
  };
}

export default function FrontendNotificationBell() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<FrontNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnreadPulse, setHasUnreadPulse] = useState(false);

  useEffect(() => {
    const fetchList = async () => {
      try {
        const response = await fetch("/api/notifications?page=1&limit=8", { cache: "no-store" });
        const data = await response.json();
        if (data?.success && Array.isArray(data.data)) {
          const mapped = data.data.map((item: {
            id: string;
            eventType: string;
            title: string | null;
            content: string | null;
            link: string | null;
            createdAt: string;
          }) => toFrontNotification(item));
          setItems(mapped);
          setHasUnreadPulse(mapped.length > 0);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchList();
  }, []);

  useEffect(() => {
    const subscription = subscribeToAdminNotifications((payload) => {
      const data = payload.new as AdminNotificationRealtimePayload;
      if (data.audience !== "public" || data.read) {
        return;
      }
      if (data.target_user_id && data.target_user_id !== session?.user?.id) {
        return;
      }

      const nextItem = toFrontNotification({
        id: data.id,
        eventType: data.event_type,
        title: data.title,
        content: data.content,
        link: data.link,
        createdAt: data.created_at,
      });

      setItems((prev) => [nextItem, ...prev].slice(0, 20));
      setHasUnreadPulse(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (open) {
      setHasUnreadPulse(false);
    }
  }, [open]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [items]);

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("mark notification read failed:", error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative h-10 w-10 rounded-full border border-white/15 bg-white/5 text-white flex items-center justify-center"
          aria-label="查看消息通知"
        >
          {hasUnreadPulse ? <BellRing className="w-4 h-4 text-cyan-300" /> : <Bell className="w-4 h-4" />}
          {items.length > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-pink-500 text-[10px] leading-5 text-white">
              {items.length > 99 ? "99+" : items.length}
            </span>
          ) : null}
        </motion.button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-[360px] max-w-[calc(100vw-24px)] bg-black/95 border-white/10 text-white p-0 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="font-medium">消息通知</div>
          <span className="text-xs text-white/50">公告 / 新博客 / 新项目</span>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-6 text-sm text-white/60">加载中...</div>
          ) : sortedItems.length === 0 ? (
            <div className="px-4 py-8 text-sm text-white/60 flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              暂无消息
            </div>
          ) : (
            <div>
              {sortedItems.map((item) => (
                <div key={item.id} className="px-4 py-3 border-b border-white/5 last:border-b-0">
                  <div className="text-sm font-medium">{item.title}</div>
                  <div className="text-xs text-white/70 mt-1 whitespace-pre-wrap break-words">{item.content}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-white/40">
                      {new Date(item.createdAt).toLocaleString("zh-CN")}
                    </span>
                    {item.link ? (
                      <Link
                        href={item.link}
                        className="text-xs text-cyan-300 hover:text-cyan-200"
                        onClick={() => {
                          markAsRead(item.id);
                          setOpen(false);
                        }}
                      >
                        查看详情
                      </Link>
                    ) : (
                      <button
                        className="text-xs text-cyan-300 hover:text-cyan-200"
                        onClick={() => markAsRead(item.id)}
                      >
                        设为已读
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
