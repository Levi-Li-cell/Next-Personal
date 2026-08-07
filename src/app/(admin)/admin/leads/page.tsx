"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Toolbar } from "@/components/admin/common";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type LeadRecord = {
  id: string;
  type: "hr" | "client";
  status: "new" | "contacted" | "in_progress" | "closed";
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  projectType: string | null;
  budgetRange: string | null;
  timeline: string | null;
  sourcePage: string | null;
  message: string;
  notes: string | null;
  createdAt: string;
};

const statusLabels: Record<LeadRecord["status"], string> = {
  new: "新线索",
  contacted: "已联系",
  in_progress: "跟进中",
  closed: "已关闭",
};

export default function LeadsManagePage() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
        type: typeFilter,
        status: statusFilter,
      });
      if (search) params.append("search", search);

      const response = await fetch(`/api/admin/leads?${params.toString()}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "获取线索失败");

      setLeads(data.data);
      setDraftNotes(
        Object.fromEntries(
          (data.data as LeadRecord[]).map((item) => [item.id, item.notes || ""])
        )
      );
      setPagination((current) => ({
        ...current,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      }));
    } catch (error) {
      console.error("Failed to fetch leads:", error);
      toast.error("获取线索列表失败");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const patchLead = async (id: string, payload: Partial<Pick<LeadRecord, "status" | "notes">>) => {
    const response = await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || "更新失败");
    return data.data as LeadRecord;
  };

  const updateStatus = async (id: string, status: LeadRecord["status"]) => {
    try {
      const updated = await patchLead(id, { status });
      setLeads((current) => current.map((item) => (item.id === id ? updated : item)));
      toast.success("线索状态已更新");
    } catch (error) {
      console.error("Failed to update lead status:", error);
      toast.error("更新状态失败");
    }
  };

  const saveNotes = async (id: string) => {
    setSavingNotesId(id);
    try {
      const updated = await patchLead(id, { notes: draftNotes[id] || "" });
      setLeads((current) => current.map((item) => (item.id === id ? updated : item)));
      setDraftNotes((current) => ({ ...current, [id]: updated.notes || "" }));
      toast.success("备注已保存");
    } catch (error) {
      console.error("Failed to save lead notes:", error);
      toast.error("保存备注失败");
    } finally {
      setSavingNotesId(null);
    }
  };

  const columns: Column<LeadRecord>[] = [
    {
      key: "type",
      header: "类型",
      cell: (item) => <span className="text-sm">{item.type === "hr" ? "招聘方" : "甲方"}</span>,
    },
    {
      key: "name",
      header: "联系人",
      cell: (item) => (
        <div className="space-y-1">
          <div className="font-medium">{item.name}</div>
          <div className="text-xs text-muted-foreground">{item.company || "未填写公司"}</div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "联系方式",
      cell: (item) => (
        <div className="space-y-1 text-sm">
          <div>{item.email || "-"}</div>
          <div className="text-muted-foreground">{item.phone || "-"}</div>
        </div>
      ),
    },
    {
      key: "intent",
      header: "需求",
      cell: (item) => (
        <div className="max-w-[320px] space-y-1">
          <div className="text-sm font-medium">{item.jobTitle || item.projectType || "未填写标题"}</div>
          <div className="line-clamp-3 text-sm text-muted-foreground">{item.message}</div>
        </div>
      ),
    },
    {
      key: "meta",
      header: "来源",
      cell: (item) => (
        <div className="space-y-1 text-sm">
          <div>{item.sourcePage || "-"}</div>
          <div className="text-muted-foreground">{new Date(item.createdAt).toLocaleString("zh-CN")}</div>
        </div>
      ),
    },
    {
      key: "notes",
      header: "备注",
      cell: (item) => (
        <div className="w-[260px] space-y-2">
          <Textarea
            value={draftNotes[item.id] || ""}
            onChange={(event) => setDraftNotes((current) => ({ ...current, [item.id]: event.target.value }))}
            placeholder="记录沟通进展、优先级或后续动作"
            className="min-h-20"
          />
          <Button size="sm" variant="outline" disabled={savingNotesId === item.id} onClick={() => saveNotes(item.id)}>
            {savingNotesId === item.id ? "保存中..." : "保存备注"}
          </Button>
        </div>
      ),
    },
    {
      key: "status",
      header: "状态",
      cell: (item) => (
        <Select value={item.status} onValueChange={(value: LeadRecord["status"]) => updateStatus(item.id, value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="线索管理" description="统一管理招聘方邀约和合作需求，并直接记录跟进备注。" onRefresh={fetchLeads} isLoading={isLoading} />

      <Toolbar
        searchPlaceholder="搜索联系人、公司、邮箱、需求"
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPagination((current) => ({ ...current, pageIndex: 0 }));
        }}
        selectFilters={[
          {
            name: "类型",
            value: typeFilter,
            options: [
              { label: "全部类型", value: "all" },
              { label: "招聘方", value: "hr" },
              { label: "甲方", value: "client" },
            ],
            onChange: (value) => {
              setTypeFilter(value);
              setPagination((current) => ({ ...current, pageIndex: 0 }));
            },
          },
          {
            name: "状态",
            value: statusFilter,
            options: [
              { label: "全部状态", value: "all" },
              { label: "新线索", value: "new" },
              { label: "已联系", value: "contacted" },
              { label: "跟进中", value: "in_progress" },
              { label: "已关闭", value: "closed" },
            ],
            onChange: (value) => {
              setStatusFilter(value);
              setPagination((current) => ({ ...current, pageIndex: 0 }));
            },
          },
        ]}
        onRefresh={fetchLeads}
        isLoading={isLoading}
      />

      <DataTable
        columns={columns}
        data={leads}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => setPagination((current) => ({ ...current, pageIndex: page }))}
        emptyTitle="暂无线索"
        emptyDescription="当前还没有来自前台的招聘或合作线索。"
      />
    </div>
  );
}
