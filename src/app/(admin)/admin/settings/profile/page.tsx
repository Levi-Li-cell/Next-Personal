"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/lib/auth/client";

interface UserProfile {
  id: string;
  name: string;
  username?: string;
  email: string;
  image?: string;
}

export default function ProfileSettingsPage() {
  const { data: session, isPending } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (session?.user) {
      setUser({
        id: session.user.id,
        name: session.user.name || "",
        username: session.user.username || "",
        email: session.user.email || "",
        image: session.user.image || "",
      });
    }
  }, [session, isPending]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        name: formData.get("name"),
        username: formData.get("username"),
        image: formData.get("image"),
      };

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser as UserProfile);
        toast.success("个人资料已更新");
      } else {
        toast.error(result.error || "更新失败");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("更新个人资料失败");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">个人资料</h1>
          <p className="text-muted-foreground">管理您的个人信息</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>更新您的个人信息和头像</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 头像 */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback className="text-2xl">
                  {user.name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">用户名 *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="请输入用户名"
                  defaultValue={user.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">显示名称</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="请输入显示名称"
                  defaultValue={user.username || ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">邮箱地址不可更改</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">头像URL</Label>
              <Input
                id="image"
                name="image"
                placeholder="https://example.com/avatar.jpg"
                defaultValue={user.image || ""}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "保存中..." : "保存更改"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
