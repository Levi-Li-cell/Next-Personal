"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { sql } from "drizzle-orm";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/admin/data-table";
import { PageHeader, Toolbar, ToolbarIcons } from "@/components/admin/common";

interface SponsorPayment {
  id: string;
  provider: string;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  userId: string | null;
  userEmail: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export default function SponsorsPage() {
  const [data, setData] = useState<SponsorPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
        status: statusFilter,
      });
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(`/api/admin/sponsors?${params.toString()}`);
      const result = await response.json();
      if (!result?.success) {
        toast.error(result?.error || "获取赞助记录失败");
        return;
      }

      setData(result.data || []);
      setPagination((prev) => ({
        ...prev,
        total: result.pagination?.total || 0,
        totalPages: result.pagination?.totalPages || 0,
      }));
    } catch (error) {
      console.error("fetch sponsor list failed:", error);
      toast.error("获取赞助记录失败");
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, search, statusFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const columns: Column<SponsorPayment>[] = useMemo(
    () => [
      { key: "select", header: "", width: "40px" },
      {
        key: "user",
        header: "赞助用户",
        cell: (item) => (
          <div>
            <div className="font-medium">{item.userEmail || "匿名用户"}</div>
            <div className="text-xs text-muted-foreground">UID: {item.userId || "-"}</div>
          </div>
        ),
      },
      {
        key: "amount",
        header: "金额",
        cell: (item) => `${(item.amount / 100).toFixed(2)} ${item.currency.toUpperCase()}`,
      },
      {
        key: "status",
        header: "状态",
        cell: (item) => item.status,
      },
      {
        key: "session",
        header: "支付会话",
        cell: (item) => (
          <div className="text-xs text-muted-foreground max-w-[260px] truncate" title={item.stripeSessionId || ""}>
            {item.stripeSessionId || "-"}
          </div>
        ),
      },
      {
        key: "createdAt",
        header: "时间",
        cell: (item) => new Date(item.createdAt).toLocaleString("zh-CN"),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <PageHeader title="赞助记录" description="查看 Stripe Sponsor 支付流水" />

      <Toolbar
        searchPlaceholder="搜索邮箱 / 会话ID"
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        selectFilters={[
          {
            name: "状态",
            value: statusFilter,
            options: [
              { label: "全部", value: "all" },
              { label: "paid", value: "paid" },
              { label: "unpaid", value: "unpaid" },
            ],
            onChange: (value) => {
              setStatusFilter(value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            },
          },
        ]}
        onRefresh={fetchList}
        isLoading={loading}
        hasSelection={selectedRows.size > 0}
        selectedCount={selectedRows.size}
        batchActions={[]}
        secondaryActions={[
          {
            label: "刷新",
            icon: ToolbarIcons.Refresh,
            onClick: fetchList,
          },
        ]}
      />

      <DataTable
        columns={columns}
        data={data}
        isLoading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, pageIndex: page }))}
        getRowId={(item) => item.id}
        selectedRows={selectedRows}
        onRowSelectionChange={setSelectedRows}
        emptyTitle="暂无赞助记录"
        emptyDescription="还没有收到支付记录"
      />
    </div>
  );
}
