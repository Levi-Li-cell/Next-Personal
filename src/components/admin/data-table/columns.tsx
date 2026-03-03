// Helper functions for table columns

// 通用状态标签
export function StatusBadge({
  status,
  labels
}: {
  status: string;
  labels: Record<string, { label: string; className: string }>
}) {
  const config = labels[status] || { label: status, className: "bg-gray-100 text-gray-800" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

// 格式化日期
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
