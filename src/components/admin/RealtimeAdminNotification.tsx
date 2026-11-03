"use client";

import { useEffect } from "react";
import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { subscribeToAdminNotifications } from "@/lib/supabase/client";
import { useAdminNotificationStore } from "@/stores/admin-notifications";

const eventLabelMap: Record<string, string> = {
  user_signup: "新用户注册",
  guestbook_message: "留言板新留言",
  blog_comment: "评论区新评论",
};

/**
 * 后台实时通知提醒：
 * - 仅处理 audience = "admin" 的通知（面向前台用户的公告等不计入后台未读数）；
 * - 新通知到达时同步 +1 到全局未读数 store，铃铛角标即时更新，无需等待轮询。
 */
export function RealtimeAdminNotification() {
  useEffect(() => {
    const subscription = subscribeToAdminNotifications((payload) => {
      const data = payload.new;
      if (data.audience !== "admin" || data.read) {
        return;
      }
      const title = eventLabelMap[data.event_type] || "新通知";
      const description = `${data.user_name} (${data.user_email})`;

      useAdminNotificationStore.getState().incrementUnread(1);

      toast(title, {
        description,
        icon: <BellRing className="w-4 h-4" />,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
