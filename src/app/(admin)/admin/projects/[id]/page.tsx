"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ProjectType } from "@/db/schema/project";
import { ProjectForm, ProjectFormValues } from "@/components/admin/projects/project-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ProjectEditPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        const data = await response.json();

        if (data.success && data.data) {
          setProject(data.data);
        } else {
          toast.error("项目不存在");
          router.push("/admin/projects");
        }
      } catch (error) {
        console.error("Failed to fetch project:", error);
        toast.error("获取项目信息失败");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId, router]);

  const handleSubmit = async (data: ProjectFormValues) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          demoUrl: data.demoUrl?.trim() ? data.demoUrl.trim() : null,
          githubUrl: data.githubUrl?.trim() ? data.githubUrl.trim() : null,
          techStack: data.techStack ? data.techStack.split(",").map((t) => t.trim()) : [],
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("项目已更新");
        router.push("/admin/projects");
      } else {
        toast.error(result.error || "更新失败");
      }
    } catch (error) {
      console.error("Failed to update project:", error);
      toast.error("更新项目失败");
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
          <Link href="/admin/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">编辑项目</h1>
          <p className="text-muted-foreground">修改项目信息</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>项目信息</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm project={project} onSubmit={handleSubmit} isLoading={isSaving} />
        </CardContent>
      </Card>
    </div>
  );
}
