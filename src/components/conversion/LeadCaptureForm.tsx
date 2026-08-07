"use client";

import { useState } from "react";
import { Loader2, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type LeadType = "hr" | "client";

type LeadCaptureFormProps = {
  type: LeadType;
  sourcePage: string;
  title: string;
  description: string;
  submitLabel?: string;
};

const placeholders: Record<LeadType, { company: string; message: string; roleLabel: string }> = {
  hr: {
    company: "公司 / 团队",
    message: "岗位方向、技术要求、面试安排等",
    roleLabel: "岗位名称",
  },
  client: {
    company: "公司 / 品牌名",
    message: "项目目标、核心需求、期望时间和预算范围",
    roleLabel: "项目类型",
  },
};

export function LeadCaptureForm({
  type,
  sourcePage,
  title,
  description,
  submitLabel = "提交需求",
}: LeadCaptureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    jobTitle: "",
    projectType: "",
    budgetRange: "",
    timeline: "",
    message: "",
  });

  const copy = placeholders[type];

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.message.trim()) {
      toast.error("请至少填写称呼和需求说明");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          type,
          sourcePage,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "提交失败");
      }

      toast.success(type === "hr" ? "已收到面试邀约信息" : "已收到合作需求");
      setForm({
        name: "",
        company: "",
        email: "",
        phone: "",
        jobTitle: "",
        projectType: "",
        budgetRange: "",
        timeline: "",
        message: "",
      });
    } catch (error) {
      console.error("Failed to submit lead:", error);
      toast.error("提交失败，请稍后再试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleField = type === "hr" ? "jobTitle" : "projectType";

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl md:p-8">
      <div className="mb-6 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-emerald-200">
          <ShieldCheck className="h-3.5 w-3.5" />
          Direct Intake
        </div>
        <h3 className="text-2xl font-semibold text-white">{title}</h3>
        <p className="max-w-xl text-sm leading-6 text-white/68">{description}</p>
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <Input
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="称呼"
          className="h-11 border-white/12 bg-black/20 text-white placeholder:text-white/35"
        />
        <Input
          value={form.company}
          onChange={(event) => updateField("company", event.target.value)}
          placeholder={copy.company}
          className="h-11 border-white/12 bg-black/20 text-white placeholder:text-white/35"
        />
        <Input
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="邮箱"
          className="h-11 border-white/12 bg-black/20 text-white placeholder:text-white/35"
        />
        <Input
          value={form.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          placeholder="手机号 / 微信"
          className="h-11 border-white/12 bg-black/20 text-white placeholder:text-white/35"
        />
        <Input
          value={form[roleField]}
          onChange={(event) => updateField(roleField, event.target.value)}
          placeholder={copy.roleLabel}
          className="h-11 border-white/12 bg-black/20 text-white placeholder:text-white/35"
        />
        <Input
          value={form.timeline}
          onChange={(event) => updateField("timeline", event.target.value)}
          placeholder={type === "hr" ? "预计沟通时间" : "预计启动时间 / 周期"}
          className="h-11 border-white/12 bg-black/20 text-white placeholder:text-white/35"
        />
        {type === "client" && (
          <Input
            value={form.budgetRange}
            onChange={(event) => updateField("budgetRange", event.target.value)}
            placeholder="预算范围"
            className="h-11 border-white/12 bg-black/20 text-white placeholder:text-white/35 md:col-span-2"
          />
        )}
        <Textarea
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          placeholder={copy.message}
          className="min-h-32 border-white/12 bg-black/20 text-white placeholder:text-white/35 md:col-span-2"
        />
        <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:items-center md:justify-between">
          <p className="text-xs leading-5 text-white/45">
            提交后会进入后台线索管理，便于后续统一跟进。
          </p>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 rounded-full bg-[#f3c96a] px-6 text-sm font-medium text-black hover:bg-[#ffd97d]"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
