"use client";

import { useEffect } from "react";

/**
 * 滚轮/触摸滚动防呆：
 * 3D 作品详情（Works.tsx）打开时会主动锁 body 滚动、关闭时恢复；
 * 若因任何异常导致锁定残留（含 SPA 路由返回 / 时），立即/滚动时自动解除，避免页面“滚不动”。
 */
export function useScrollGuard() {
  useEffect(() => {
    const releaseStuckLock = () => {
      const doc = document.documentElement;
      const body = document.body;
      const detailOpen = document.querySelector(".wk-detail");
      if (detailOpen) return; // 详情打开时保持锁定，让详情层独占滚动
      for (const el of [body, doc]) {
        if (el.style.overflow === "hidden") el.style.overflow = "";
        if (el.style.overflowY === "hidden") el.style.overflowY = "";
      }
    };
    // 挂载即检查一次：SPA 从其他页面返回时，若 3D 详情曾残留锁定，立即解锁
    releaseStuckLock();
    window.addEventListener("wheel", releaseStuckLock, { passive: true });
    window.addEventListener("touchmove", releaseStuckLock, { passive: true });
    window.addEventListener("scroll", releaseStuckLock, { passive: true });
    return () => {
      window.removeEventListener("wheel", releaseStuckLock);
      window.removeEventListener("touchmove", releaseStuckLock);
      window.removeEventListener("scroll", releaseStuckLock);
    };
  }, []);
}
