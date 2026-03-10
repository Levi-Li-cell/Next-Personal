"use client";

import { useEffect } from "react";
import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { subscribeToAdminNotifications } from "@/lib/supabase/client";

const eventLabelMap: Record<string, string> = {
  user_signup: "新用户注册",
  guestbook_message: "留言板新留言",
  blog_comment: "评论区新评论",
};

export function RealtimeAdminNotification() {
  useEffect(() => {
    const subscription = subscribeToAdminNotifications((payload) => {
      const data = payload.new;
      const title = eventLabelMap[data.event_type] || "新通知";
      const description = `${data.user_name} (${data.user_email})`;

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
