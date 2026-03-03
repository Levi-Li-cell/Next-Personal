"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, FolderKanban, Eye, ArrowRight, Activity } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  users: number;
  blogs: number;
  projects: number;
  views: number;
}

interface RecentActivity {
  id: string;
  type: "blog" | "project" | "user";
  title: string;
  time: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    blogs: 0,
    projects: 0,
    views: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 获取统计数据
        const [usersRes, blogsRes, projectsRes] = await Promise.all([
          fetch("/api/admin/users?limit=1"),
          fetch("/api/blog?limit=1&status=all"),
          fetch("/api/projects?limit=1"),
        ]);

        const usersData = await usersRes.json();
        const blogsData = await blogsRes.json();
        const projectsData = await projectsRes.json();

        setStats({
          users: usersData.pagination?.total || 0,
          blogs: blogsData.pagination?.total || 0,
          projects: projectsData.pagination?.total || 0,
          views: 0, // TODO: 添加访问量统计
        });

        // 模拟最近活动
        setRecentActivities([
          { id: "1", type: "blog", title: "新文章发布", time: "5分钟前" },
          { id: "2", type: "user", title: "新用户注册", time: "10分钟前" },
          { id: "3", type: "project", title: "项目更新", time: "1小时前" },
        ]);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: "用户总数",
      value: stats.users,
      icon: Users,
      description: "注册用户数量",
      href: "/admin/users",
    },
    {
      title: "博客文章",
      value: stats.blogs,
      icon: FileText,
      description: "已发布文章数量",
      href: "/admin/blog",
    },
    {
      title: "项目数量",
      value: stats.projects,
      icon: FolderKanban,
      description: "展示项目数量",
      href: "/admin/projects",
    },
    {
      title: "总访问量",
      value: stats.views,
      icon: Eye,
      description: "网站总访问量",
      href: "#",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">仪表盘</h1>
        <p className="text-muted-foreground">欢迎回来！这是您的后台管理概览。</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : stat.value.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 最近活动 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              最近活动
            </CardTitle>
            <CardDescription>系统最近的操作记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2">
                    {activity.type === "blog" && (
                      <FileText className="h-4 w-4 text-blue-500" />
                    )}
                    {activity.type === "user" && (
                      <Users className="h-4 w-4 text-green-500" />
                    )}
                    {activity.type === "project" && (
                      <FolderKanban className="h-4 w-4 text-purple-500" />
                    )}
                    <span className="text-sm">{activity.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 快捷操作 */}
        <Card>
          <CardHeader>
            <CardTitle>快捷操作</CardTitle>
            <CardDescription>常用功能快速入口</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Button variant="outline" className="justify-between" asChild>
                <Link href="/admin/blog/create">
                  创建新文章
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="justify-between" asChild>
                <Link href="/admin/projects/create">
                  添加新项目
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="justify-between" asChild>
                <Link href="/admin/users">
                  管理用户
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="justify-between" asChild>
                <Link href="/admin/comments">
                  审核评论
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
