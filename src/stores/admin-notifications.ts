"use client";

import { create } from "zustand";

/**
 * 后台管理员通知 · 未读数全局同步 store
 *
 * AdminHeader 铃铛角标、通知中心页面、RealtimeAdminNotification 实时提醒共享同一份未读数：
 * - 读取（标记已读）后调用 decrementUnread / refreshUnreadCount，铃铛角标即时同步；
 * - 新通知到达（Supabase 实时 INSERT）后调用 incrementUnread，无需等待 30s 轮询。
 */

interface AdminNotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decrementUnread: (delta?: number) => void;
  incrementUnread: (delta?: number) => void;
  refreshUnreadCount: () => Promise<void>;
}

let inFlightRefresh: Promise<void> | null = null;

export const useAdminNotificationStore = create<AdminNotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: Math.max(0, Number(count) || 0) }),
  decrementUnread: (delta = 1) =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - Math.max(0, delta)) })),
  incrementUnread: (delta = 1) =>
    set((state) => ({ unreadCount: state.unreadCount + Math.max(0, delta) })),
  refreshUnreadCount: async () => {
    // 并发调用去重：多个组件同时挂载/刷新时只发一次请求
    if (inFlightRefresh) return inFlightRefresh;
    inFlightRefresh = (async () => {
      try {
        const response = await fetch("/api/admin/notifications?unreadOnly=true&limit=1&page=1", {
          cache: "no-store",
        });
        const result = await response.json();
        if (result?.success) {
          set({ unreadCount: Math.max(0, Number(result.unreadCount) || 0) });
        }
      } catch (error) {
        console.error("Fetch unread notifications failed:", error);
      } finally {
        inFlightRefresh = null;
      }
    })();
    return inFlightRefresh;
  },
}));
