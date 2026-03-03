"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface ToolbarAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  disabled?: boolean;
  loading?: boolean;
}

export interface ToolbarSelectFilter {
  name: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

export interface ToolbarProps {
  /** 搜索占位符 */
  searchPlaceholder?: string;
  /** 搜索值 */
  searchValue?: string;
  /** 搜索变更回调 */
  onSearchChange?: (value: string) => void;
  /** 下拉筛选器 */
  selectFilters?: ToolbarSelectFilter[];
  /** 主要操作按钮（新增等） */
  primaryActions?: ToolbarAction[];
  /** 次要操作按钮（导出等） */
  secondaryActions?: ToolbarAction[];
  /** 批量操作（选中时显示） */
  batchActions?: ToolbarAction[];
  /** 是否选中项 */
  hasSelection?: boolean;
  /** 选中数量 */
  selectedCount?: number;
  /** 刷新按钮 */
  onRefresh?: () => void;
  /** 是否加载中 */
  isLoading?: boolean;
  /** 额外的左侧内容 */
  leftContent?: React.ReactNode;
  /** 额外的右侧内容 */
  rightContent?: React.ReactNode;
  /** 紧凑模式 */
  compact?: boolean;
}

export function Toolbar({
  searchPlaceholder = "请输入关键词搜索",
  searchValue,
  onSearchChange,
  selectFilters,
  primaryActions,
  secondaryActions,
  batchActions,
  hasSelection = false,
  selectedCount = 0,
  onRefresh,
  isLoading,
  leftContent,
  rightContent,
  compact = false,
}: ToolbarProps) {
  return (
    <div className={cn(
      "bg-background border rounded-md p-3 mb-4",
      compact && "p-2"
    )}>
      <div className="flex flex-wrap items-center gap-3">
        {/* 左侧：搜索和筛选 */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* 搜索框 */}
          {onSearchChange && (
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          )}

          {/* 下拉筛选器 */}
          {selectFilters?.map((filter) => (
            <Select
              key={filter.name}
              value={filter.value}
              onValueChange={filter.onChange}
            >
              <SelectTrigger className="w-32 h-9">
                <SelectValue placeholder={filter.name} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {/* 额外的左侧内容 */}
          {leftContent}
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-2">
          {/* 刷新按钮 */}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          )}

          {/* 批量操作（有选中时显示） */}
          {hasSelection && batchActions && batchActions.length > 0 && (
            <div className="flex items-center gap-2 px-2 py-1 bg-muted rounded-md">
              <span className="text-sm text-muted-foreground">
                已选 {selectedCount} 项
              </span>
              {batchActions.slice(0, 2).map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={action.onClick}
                  disabled={action.disabled || action.loading}
                >
                  {action.icon}
                  <span className="ml-1">{action.label}</span>
                </Button>
              ))}
              {batchActions.length > 2 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {batchActions.slice(2).map((action, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className={action.variant === "destructive" ? "text-red-600" : ""}
                      >
                        {action.icon}
                        <span className="ml-2">{action.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          {/* 次要操作（更多操作下拉） */}
          {secondaryActions && secondaryActions.length > 0 && (
            <>
              {secondaryActions.length <= 2 ? (
                secondaryActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={action.onClick}
                    disabled={action.disabled || action.loading}
                  >
                    {action.icon}
                    <span className="ml-1">{action.label}</span>
                  </Button>
                ))
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {secondaryActions.map((action, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={action.onClick}
                        disabled={action.disabled}
                      >
                        {action.icon}
                        <span className="ml-2">{action.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}

          {/* 主要操作按钮 */}
          {primaryActions?.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "default"}
              size="sm"
              className="h-9"
              onClick={action.onClick}
              disabled={action.disabled || action.loading}
            >
              {action.loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                action.icon || <Plus className="h-4 w-4" />
              )}
              <span className="ml-1">{action.label}</span>
            </Button>
          ))}

          {/* 额外的右侧内容 */}
          {rightContent}
        </div>
      </div>
    </div>
  );
}

// 预设的工具栏按钮图标
export const ToolbarIcons = {
  Search: <Search className="h-4 w-4" />,
  Plus: <Plus className="h-4 w-4" />,
  Refresh: <RefreshCw className="h-4 w-4" />,
  Download: <Download className="h-4 w-4" />,
  Upload: <Upload className="h-4 w-4" />,
  Trash: <Trash2 className="h-4 w-4" />,
};
