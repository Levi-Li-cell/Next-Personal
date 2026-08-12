"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const FEATURE_LABELS: { key: string; label: string; description: string }[] = [
  { key: "showAuthorPage", label: "作者页面", description: "显示 /author 作者主页及所有导航入口；关闭时启用路由守卫并默认隐藏" },
  { key: "enable3DTools", label: "首页编辑器", description: "显示首页 3D 编辑工具，包括贴纸、运镜和资料编辑；默认隐藏" },
  { key: "showSponsorPage", label: "赞助页", description: "显示作者页赞助入口和 /sponsor 路由" },
  { key: "showWeatherWidget", label: "天气组件", description: "在作者页显示实时天气信息和城市查询" },
  { key: "showSnakeGame", label: "3D 贪吃蛇", description: "在作者页显示游戏入口和 /snake3d 路由" },
  { key: "showGeoLab", label: "空间实验室", description: "在作者页显示空间分析实验室入口和 /geo-lab 路由" },
];

export default function SettingsPage() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [flagsSaving, setFlagsSaving] = useState(false);
  const [evaluations, setEvaluations] = useState<string[]>([]);
  const [evalSaving, setEvalSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/features")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setFlags(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setFlagsLoading(false));

    fetch("/api/author/evaluation")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setEvaluations(data.data.map((item: { content: string }) => item.content));
        }
      })
      .catch(() => {});
  }, []);

  const toggleFlag = (key: string) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveFlags = async () => {
    setFlagsSaving(true);
    try {
      const response = await fetch("/api/settings/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flags),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("功能开关已保存");
      } else {
        toast.error(data.error || "保存失败");
      }
    } catch {
      toast.error("保存失败，请稍后再试");
    } finally {
      setFlagsSaving(false);
    }
  };

  const handleSaveSiteSettings = () => {
    toast.success("网站设置已保存");
  };

  const updateEvaluation = (index: number, value: string) => {
    setEvaluations((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const addEvaluation = () => {
    setEvaluations((prev) => [...prev, ""]);
  };

  const removeEvaluation = (index: number) => {
    setEvaluations((prev) => prev.filter((_, i) => i !== index));
  };

  const saveEvaluations = async () => {
    setEvalSaving(true);
    try {
      const items = evaluations
        .map((content, sortOrder) => ({ content, sortOrder }))
        .filter((item) => item.content.trim());
      const response = await fetch("/api/author/evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("自我评价已保存");
      } else {
        toast.error(data.error || "保存失败");
      }
    } catch {
      toast.error("保存失败，请稍后再试");
    } finally {
      setEvalSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">前台显隐与系统设置</h1>
        <p className="text-muted-foreground">控制作者页面、首页编辑器及其他前台功能</p>
      </div>

      <div className="grid gap-6">
        {/* 功能开关 */}
        <Card>
          <CardHeader>
            <CardTitle>前台显隐开关</CardTitle>
            <CardDescription>开关保存后立即控制对应页面或功能，作者页面与首页编辑器默认隐藏</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {flagsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                加载中...
              </div>
            ) : (
              <>
                {FEATURE_LABELS.map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch
                      checked={Boolean(flags[item.key])}
                      onCheckedChange={() => toggleFlag(item.key)}
                      aria-label={`${item.label}显隐开关`}
                    />
                  </div>
                ))}
                <Button onClick={saveFlags} disabled={flagsSaving}>
                  {flagsSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  保存功能开关
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* 自我评价管理 */}
        <Card>
          <CardHeader>
            <CardTitle>自我评价管理</CardTitle>
            <CardDescription>管理作者页和简历页显示的自我评价内容</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {evaluations.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <Textarea
                  value={item}
                  onChange={(e) => updateEvaluation(index, e.target.value)}
                  placeholder="输入自我评价内容..."
                  rows={2}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEvaluation(index)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" onClick={addEvaluation}>
                <Plus className="h-4 w-4 mr-2" />
                添加一条
              </Button>
              <Button onClick={saveEvaluations} disabled={evalSaving}>
                {evalSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                保存自我评价
              </Button>
            </div>
          </CardContent>
        </Card>

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
