"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectForm, ProjectFormValues } from "@/components/admin/projects/project-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ProjectCreatePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (data: ProjectFormValues) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          techStack: data.techStack ? data.techStack.split(",").map((t) => t.trim()) : [],
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("项目创建成功");
        router.push("/admin/projects");
      } else {
        toast.error(result.error || "创建失败");
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("创建项目失败");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">创建项目</h1>
          <p className="text-muted-foreground">添加新的展示项目</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>项目信息</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm onSubmit={handleSubmit} isLoading={isSaving} />
        </CardContent>
      </Card>
    </div>
  );
}
