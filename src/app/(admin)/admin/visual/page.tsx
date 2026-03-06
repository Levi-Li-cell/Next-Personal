"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactECharts from "echarts-for-react";
import { EventPrismScene } from "@/components/admin/visual/EventPrismScene";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface VisualResponse {
  success: boolean;
  data: {
    summary: {
      users: number;
      blogs: number;
      projects: number;
      comments: number;
      guestbook: number;
      unread: number;
      chatMessages: number;
    };
    eventDistribution: Array<{ event_type: string; count: number }>;
    weeklyTrend: Array<{ day: string; users: number; comments: number; guestbook: number }>;
    recentNotifications: Array<{
      id: string;
      user_name: string;
      user_email: string;
      event_type: string;
      title?: string;
      content?: string;
      link?: string;
      read: boolean;
      created_at: string;
    }>;
  };
}

export default function AdminVisualPage() {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<VisualResponse["data"] | null>(null);
  const [activeEventType, setActiveEventType] = useState<string>("user_signup");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/admin/visual", { cache: "no-store" });
        const result: VisualResponse = await response.json();
        if (result.success) {
          setPayload(result.data);
        }
      } catch (error) {
        console.error("Fetch visual data failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const trafficOption = useMemo(() => ({
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: payload?.weeklyTrend.map((i) => i.day) || [],
      axisLine: { lineStyle: { color: "#6ee7b7" } },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
    },
    series: [
      {
        name: "访问量",
        type: "line",
        smooth: true,
        data: payload?.weeklyTrend.map((i) => i.users + i.comments + i.guestbook) || [],
        lineStyle: { width: 3, color: "#22d3ee" },
        areaStyle: { color: "rgba(34,211,238,0.25)" },
      },
      {
        name: "新注册",
        type: "bar",
        data: payload?.weeklyTrend.map((i) => i.users) || [],
        itemStyle: { color: "#22c55e" },
      },
      {
        name: "新评论",
        type: "bar",
        data: payload?.weeklyTrend.map((i) => i.comments) || [],
        itemStyle: { color: "#f59e0b" },
      },
      {
        name: "新留言",
        type: "bar",
        data: payload?.weeklyTrend.map((i) => i.guestbook) || [],
        itemStyle: { color: "#a855f7" },
      },
    ],
    legend: { textStyle: { color: "#cbd5e1" } },
    backgroundColor: "transparent",
    textStyle: { color: "#e2e8f0" },
  }), [payload]);

  const notifyOption = useMemo(() => ({
    tooltip: { trigger: "item" },
    legend: { bottom: 0, textStyle: { color: "#cbd5e1" } },
    series: [
      {
        name: "事件来源",
        type: "pie",
        radius: ["45%", "70%"],
        data: (payload?.eventDistribution || []).map((item) => ({
          value: item.count,
          name:
            item.event_type === "user_signup"
              ? "用户注册"
              : item.event_type === "guestbook_message"
                ? "留言板"
                : item.event_type === "blog_comment"
                  ? "评论区"
                  : item.event_type,
        })),
      },
    ],
    backgroundColor: "transparent",
  }), [payload]);

  const summaryCards = [
    { title: "注册用户", value: payload?.summary.users ?? 0 },
    { title: "博客文章", value: payload?.summary.blogs ?? 0 },
    { title: "项目数量", value: payload?.summary.projects ?? 0 },
    { title: "评论总数", value: payload?.summary.comments ?? 0 },
    { title: "留言总数", value: payload?.summary.guestbook ?? 0 },
    { title: "客服消息", value: payload?.summary.chatMessages ?? 0 },
    { title: "未读通知", value: payload?.summary.unread ?? 0 },
  ];

  const filteredRecent = useMemo(() => {
    if (!payload) return [];
    return payload.recentNotifications
      .filter((item) => item.event_type === activeEventType)
      .slice(0, 12);
  }, [payload, activeEventType]);

  const eventLabel = (type: string) =>
    type === "user_signup"
      ? "用户注册"
      : type === "guestbook_message"
        ? "留言板"
        : type === "blog_comment"
          ? "评论区"
          : type;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">可视化大屏</h1>
          <p className="text-muted-foreground">ECharts + Three.js 实时态势展示</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/" className="inline-flex items-center gap-2">
            <Home className="w-4 h-4" />
            返回前台
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map((item) => (
          <Card key={item.title} className="border-cyan-500/20 bg-slate-900/60">
            <CardContent className="pt-5">
              <div className="text-xs text-slate-400">{item.title}</div>
              <div className="mt-2 text-2xl font-bold text-cyan-200">{loading ? "..." : item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-cyan-500/20 bg-slate-900/60 p-4">
          <h2 className="mb-3 text-sm text-cyan-300">近 7 天业务趋势</h2>
          <ReactECharts option={trafficOption} style={{ height: 320 }} />
        </div>
        <div className="rounded-xl border border-cyan-500/20 bg-slate-900/60 p-4">
          <h2 className="mb-3 text-sm text-cyan-300">消息来源分布</h2>
          <ReactECharts option={notifyOption} style={{ height: 320 }} />
        </div>
      </div>

      <div className="rounded-xl border border-cyan-500/20 bg-slate-900/60 p-4">
        <h2 className="mb-3 text-sm text-cyan-300">Three.js 交互事件棱柱（拖动旋转，悬浮高亮）</h2>
        <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <EventPrismScene
            data={payload?.eventDistribution || []}
            activeEventType={activeEventType}
            onSelect={setActiveEventType}
          />

          <div className="rounded-lg border border-cyan-500/20 bg-slate-950/50 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-cyan-300">最近事件明细</h3>
              <span className="text-xs text-slate-400">{eventLabel(activeEventType)}</span>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
              {filteredRecent.length === 0 ? (
                <div className="text-xs text-slate-400">暂无该类型事件</div>
              ) : (
                filteredRecent.map((item) => (
                  <div key={item.id} className="rounded-md border border-slate-700/70 bg-slate-900/70 px-3 py-2">
                    <div className="text-xs text-slate-200 font-medium">{item.user_name}</div>
                    {item.title ? <div className="text-[11px] text-cyan-300 truncate">{item.title}</div> : null}
                    <div className="text-[11px] text-slate-400 truncate">{item.user_email}</div>
                    {item.content ? <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">{item.content}</div> : null}
                    <div className="mt-1 text-[11px] text-slate-500">
                      {new Date(item.created_at).toLocaleString("zh-CN")}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
