"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { User } from "@/db/schema/auth/user";
import { UserForm, UserFormValues } from "@/components/admin/users/user-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function UserEditPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/admin/users/${userId}`);
        const data = await response.json();

        if (data.success) {
          setUser(data.data);
        } else {
          toast.error("用户不存在");
          router.push("/admin/users");
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        toast.error("获取用户信息失败");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId, router]);

  const handleSubmit = async (data: UserFormValues) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("用户信息已更新");
        router.push("/admin/users");
      } else {
        toast.error(result.error || "更新失败");
      }
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error("更新用户信息失败");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">编辑用户</h1>
          <p className="text-muted-foreground">修改用户信息</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>用户信息</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm user={user} onSubmit={handleSubmit} isLoading={isSaving} />
        </CardContent>
      </Card>
    </div>
  );
}
