"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface TimeEditValues {
  createdAt: string | null;
  publishedAt: string | null;
}

interface TimeEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 条目标题，用于弹窗描述 */
  title: string;
  createdAt?: string | Date | null;
  publishedAt?: string | Date | null;
  isLoading?: boolean;
  onSave: (values: TimeEditValues) => void;
}

/** Date → datetime-local 输入值（本地时区），无效或空值返回空串 */
function toDatetimeLocal(value?: string | Date | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TimeEditDialog({ open, onOpenChange, title, createdAt, publishedAt, isLoading, onSave }: TimeEditDialogProps) {
  const [createdAtInput, setCreatedAtInput] = useState("");
  const [publishedAtInput, setPublishedAtInput] = useState("");
  const [lastOpen, setLastOpen] = useState(false);

  // 每次打开时以传入条目的时间重置输入框（React 官方的 props 变化重置状态模式）
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setCreatedAtInput(toDatetimeLocal(createdAt));
      setPublishedAtInput(toDatetimeLocal(publishedAt));
    }
  }

  const handleSave = () => {
    if (!createdAtInput) return;
    onSave({
      createdAt: new Date(createdAtInput).toISOString(),
      publishedAt: publishedAtInput ? new Date(publishedAtInput).toISOString() : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑时间</DialogTitle>
          <DialogDescription>修改「{title}」的创建时间和发布时间。发布时间留空表示未发布（草稿）。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="time-edit-created">创建时间</Label>
            <Input
              id="time-edit-created"
              type="datetime-local"
              value={createdAtInput}
              onChange={(event) => setCreatedAtInput(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time-edit-published">发布时间</Label>
            <Input
              id="time-edit-published"
              type="datetime-local"
              value={publishedAtInput}
              onChange={(event) => setPublishedAtInput(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !createdAtInput}>
            {isLoading ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
