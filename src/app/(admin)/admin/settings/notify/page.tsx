"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface NotifySettingItem {
  id: string;
  name: string;
  email: string;
  notify_email: string;
  enabled: boolean;
}

interface NotifySettingsResponse {
  success: boolean;
  error?: string;
  data?: NotifySettingItem[];
  meta?: {
    smtpConfigured?: boolean;
  };
}

export default function NotifySettingsPage() {
  const [item, setItem] = useState<NotifySettingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [smtpConfigured, setSmtpConfigured] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/notify-settings");
      const result: NotifySettingsResponse = await response.json();
      if (result.success) {
        setItem(result.data?.[0] || null);
        setSmtpConfigured(Boolean(result.meta?.smtpConfigured));
      } else {
        toast.error(result.error || "获取配置失败");
      }
    } catch (error) {
      console.error("Fetch notify settings failed:", error);
      toast.error("获取配置失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!item) return;
    if (!item.notify_email.trim()) {
      toast.error("通知邮箱不能为空");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/notify-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifyEmail: item.notify_email,
          enabled: item.enabled,
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("通知邮箱配置已保存");
        return;
      }
      toast.error(result.error || "保存失败");
    } catch (error) {
      console.error("Save notify settings failed:", error);
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!item) return;
    if (!smtpConfigured) {
      toast.error("SMTP 未配置，请先配置 QQ_SMTP_USER 和 QQ_SMTP_PASS");
      return;
    }

    setSendingTest(true);
    try {
      const response = await fetch("/api/admin/notify-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: item.notify_email,
          adminName: item.name,
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(`测试邮件已发送到 ${item.notify_email}`);
      } else {
        toast.error(result.error || "发送测试邮件失败");
      }
    } catch (error) {
      console.error("Send test mail failed:", error);
      toast.error("发送测试邮件失败");
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">管理员通知邮箱</h1>
          <p className="text-muted-foreground">配置当前登录管理员的通知邮箱地址</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>通知接收配置</CardTitle>
          <CardDescription>开启后会在新注册、留言、评论时发送邮件</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!loading && !smtpConfigured ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              SMTP 未配置：请在环境变量中设置 QQ_SMTP_USER 和 QQ_SMTP_PASS，重启项目后再发送测试邮件。
            </div>
          ) : null}

          {loading ? (
            <div className="text-sm text-muted-foreground">加载中...</div>
          ) : !item ? (
            <div className="text-sm text-muted-foreground">未获取到当前账号信息</div>
          ) : (
            <div className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">账号邮箱: {item.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`enabled-${item.id}`}>启用</Label>
                  <Switch
                    id={`enabled-${item.id}`}
                    checked={item.enabled}
                    onCheckedChange={(checked) => setItem((prev) => (prev ? { ...prev, enabled: checked } : prev))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`notify-email-${item.id}`}>通知邮箱</Label>
                <Input
                  id={`notify-email-${item.id}`}
                  type="email"
                  value={item.notify_email}
                  onChange={(e) => setItem((prev) => (prev ? { ...prev, notify_email: e.target.value } : prev))}
                  placeholder="请输入通知邮箱"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendTest}
                  disabled={sendingTest || !item.notify_email || !smtpConfigured}
                >
                  {sendingTest ? "发送中..." : "发送测试邮件"}
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? "保存中..." : "保存配置"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
