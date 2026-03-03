"use client";

import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function PageHeader({
  title,
  description,
  actionLabel,
  onAction,
  onRefresh,
  isLoading,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        )}
        {actionLabel && onAction && (
          <Button onClick={onAction}>
            <Plus className="h-4 w-4 mr-2" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
