"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Link from "next/link";

export default function SettingsPage() {
  const handleSaveSiteSettings = () => {
    toast.success("网站设置已保存");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">系统设置</h1>
        <p className="text-muted-foreground">管理系统配置和偏好设置</p>
      </div>

      <div className="grid gap-6">
        {/* 网站基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>网站信息</CardTitle>
            <CardDescription>配置网站的基本信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="siteName">网站名称</Label>
                <Input id="siteName" placeholder="我的博客" defaultValue="个人博客" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteUrl">网站地址</Label>
                <Input id="siteUrl" placeholder="https://example.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteDescription">网站描述</Label>
              <Input id="siteDescription" placeholder="简短描述您的网站" />
            </div>
            <Button onClick={handleSaveSiteSettings}>保存设置</Button>
          </CardContent>
        </Card>

        {/* SEO 设置 */}
        <Card>
          <CardHeader>
            <CardTitle>SEO 设置</CardTitle>
            <CardDescription>优化搜索引擎排名的设置</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaKeywords">关键词</Label>
              <Input id="metaKeywords" placeholder="博客, 技术, 开发" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaDescription">描述</Label>
              <Input id="metaDescription" placeholder="用于搜索引擎显示的描述文字" />
            </div>
            <Button onClick={handleSaveSiteSettings}>保存设置</Button>
          </CardContent>
        </Card>

        {/* 快捷链接 */}
        <Card>
          <CardHeader>
            <CardTitle>账户设置</CardTitle>
            <CardDescription>管理您的账户和安全设置</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">个人资料</p>
                <p className="text-sm text-muted-foreground">更新您的个人信息和头像</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/admin/settings/profile">编辑</Link>
              </Button>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">修改密码</p>
                <p className="text-sm text-muted-foreground">更改您的登录密码</p>
              </div>
              <Button variant="outline">修改</Button>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">通知邮箱配置</p>
                <p className="text-sm text-muted-foreground">为每个管理员设置独立通知邮箱</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/admin/settings/notify">配置</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
