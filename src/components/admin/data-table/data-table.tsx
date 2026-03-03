"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../common/empty-state";
import { Checkbox } from "@/components/ui/checkbox";

export interface Column<T> {
  key: string;
  header: string | React.ReactNode;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  pagination?: {
    pageIndex: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  selectedRows?: Set<string>;
  onRowSelectionChange?: (selected: Set<string>) => void;
  getRowId?: (item: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  pagination,
  onPageChange,
  selectedRows = new Set(),
  onRowSelectionChange,
  getRowId,
  emptyTitle = "暂无数据",
  emptyDescription = "没有找到任何数据",
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && data.every((item) => {
    const id = getRowId ? getRowId(item) : String((item as { id?: string }).id);
    return selectedRows.has(id);
  });
  const someSelected = data.some((item) => {
    const id = getRowId ? getRowId(item) : String((item as { id?: string }).id);
    return selectedRows.has(id);
  });

  const toggleAll = () => {
    if (!onRowSelectionChange || !getRowId) return;
    const newSelected = new Set(selectedRows);
    if (allSelected) {
      data.forEach((item) => {
        newSelected.delete(getRowId(item));
      });
    } else {
      data.forEach((item) => {
        newSelected.add(getRowId(item));
      });
    }
    onRowSelectionChange(newSelected);
  };

  const toggleRow = (item: T) => {
    if (!onRowSelectionChange || !getRowId) return;
    const id = getRowId(item);
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onRowSelectionChange(newSelected);
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} style={{ width: col.width }}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} className="h-48 text-center">
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} style={{ width: col.width }}>
                  {col.key === "select" ? (
                    <Checkbox
                      checked={allSelected || (someSelected && "indeterminate")}
                      onCheckedChange={toggleAll}
                      aria-label="全选"
                    />
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, rowIndex) => {
              const rowId = getRowId ? getRowId(item) : String(rowIndex);
              const isSelected = selectedRows.has(rowId);
              return (
                <TableRow
                  key={rowId}
                  data-state={isSelected && "selected"}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.key === "select" ? (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRow(item)}
                          aria-label="选择行"
                        />
                      ) : col.cell ? (
                        col.cell(item)
                      ) : (
                        String((item as Record<string, unknown>)[col.key] ?? "")
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            共 {pagination.total} 条记录，第 {pagination.pageIndex + 1} /{" "}
            {pagination.totalPages} 页
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(0)}
              disabled={pagination.pageIndex === 0}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.pageIndex - 1)}
              disabled={pagination.pageIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.pageIndex + 1)}
              disabled={pagination.pageIndex >= pagination.totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.totalPages - 1)}
              disabled={pagination.pageIndex >= pagination.totalPages - 1}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to create select column
export function createSelectColumn<T>(getRowId: (item: T) => string): Column<T> {
  return {
    key: "select",
    header: "",
    width: "40px",
  };
}
