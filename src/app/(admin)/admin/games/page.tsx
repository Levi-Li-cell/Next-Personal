"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { InteractiveWorkType } from "@/db/schema/game";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ConfirmDialog, PageHeader, TimeEditDialog, Toolbar, ToolbarIcons } from "@/components/admin/common";
import { getGameColumns } from "@/components/admin/games/game-table";
import { GameForm, type GameFormValues } from "@/components/admin/games/game-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function GamesManagePage() {
  const [games, setGames] = useState<InteractiveWorkType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sceneTypeFilter, setSceneTypeFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; game: InteractiveWorkType | null }>({ open: false, game: null });
  const [publishDialog, setPublishDialog] = useState<{ open: boolean; game: InteractiveWorkType | null }>({ open: false, game: null });
  const [timeDialog, setTimeDialog] = useState<{ open: boolean; game: InteractiveWorkType | null }>({ open: false, game: null });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingTime, setIsSavingTime] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchGames = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
        status: statusFilter,
        sceneType: sceneTypeFilter,
      });
      if (search) params.append("search", search);

      const response = await fetch(`/api/admin/games?${params.toString()}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "获取游戏列表失败");

      setGames(data.data);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      }));
    } catch (error) {
      console.error("Failed to fetch games:", error);
      toast.error("获取游戏列表失败");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, search, statusFilter, sceneTypeFilter]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const handlePublish = async () => {
    if (!publishDialog.game) return;
    setIsPublishing(true);
    try {
      const response = await fetch(`/api/admin/games/${publishDialog.game.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "发布失败");
      toast.success("游戏已发布");
      fetchGames();
    } catch (error) {
      console.error("Failed to publish game:", error);
      toast.error("发布失败");
    } finally {
      setIsPublishing(false);
      setPublishDialog({ open: false, game: null });
    }
  };

  const handleTimeSave = async (values: { createdAt: string | null; publishedAt: string | null }) => {
    if (!timeDialog.game) return;
    setIsSavingTime(true);
    try {
      const response = await fetch(`/api/admin/games/${timeDialog.game.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createdAt: values.createdAt, publishedAt: values.publishedAt }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "保存失败");
      toast.success("时间已更新");
      setTimeDialog({ open: false, game: null });
      fetchGames();
    } catch (error) {
      console.error("Failed to update game time:", error);
      toast.error("时间更新失败");
    } finally {
      setIsSavingTime(false);
    }
  };

  const handleCreate = async (values: GameFormValues) => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          tags: (values.tags || "")
            .split(/[,，]/)
            .map((tag) => tag.trim())
            .filter(Boolean),
          controlsHint: (values.controlsHint || "")
            .split(/[,，\n]/)
            .map((hint) => hint.trim())
            .filter(Boolean),
          sceneConfig: values.sceneType === "html-game"
            ? { htmlUrl: values.htmlUrl }
            : values.sceneConfig ? JSON.parse(values.sceneConfig) : {},
          tagline: values.tagline || null,
          coverImage: values.coverImage || null,
          coverGradient: values.coverGradient || null,
          authorLink: values.authorLink || null,
        }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "创建失败");

      toast.success(values.status === "published" ? "游戏已创建并发布" : "游戏草稿已创建");
      setCreateDialogOpen(false);
      setSelectedRows(new Set());
      if (pagination.pageIndex === 0) {
        fetchGames();
      } else {
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      }
    } catch (error) {
      console.error("Failed to create game:", error);
      toast.error(error instanceof Error ? error.message : "创建游戏失败");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.game) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/games/${deleteDialog.game.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "删除失败");
      toast.success("游戏已删除");
      fetchGames();
    } catch (error) {
      console.error("Failed to delete game:", error);
      toast.error("删除游戏失败");
    } finally {
      setIsDeleting(false);
      setDeleteDialog({ open: false, game: null });
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRows.size === 0) return;
    setIsDeleting(true);
    try {
      await Promise.all(Array.from(selectedRows).map((id) => fetch(`/api/admin/games/${id}`, { method: "DELETE" })));
      toast.success(`已删除 ${selectedRows.size} 个游戏`);
      setSelectedRows(new Set());
      fetchGames();
    } catch (error) {
      console.error("Failed to batch delete games:", error);
      toast.error("批量删除失败");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<InteractiveWorkType>[] = [
    { key: "select", header: "", width: "40px" },
    ...getGameColumns({
      onEdit: () => toast.info("编辑功能开发中，请直接通过 API 或数据库修改"),
      onEditTime: (game) => setTimeDialog({ open: true, game }),
      onDelete: (game) => setDeleteDialog({ open: true, game }),
      onPublish: (game) => setPublishDialog({ open: true, game }),
    }),
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="游戏管理" description="管理互动小游戏、场景参数和发布状态。" />

      <Toolbar
        searchPlaceholder="搜索游戏名称、标签或描述"
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
              { label: "全部状态", value: "all" },
              { label: "已发布", value: "published" },
              { label: "草稿", value: "draft" },
            ],
            onChange: (value) => {
              setStatusFilter(value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            },
          },
          {
            name: "场景类型",
            value: sceneTypeFilter,
            options: [
              { label: "全部类型", value: "all" },
              { label: "HTML 游戏", value: "html-game" },
              { label: "晶体簇", value: "crystal-cluster" },
              { label: "波场", value: "wave-field" },
              { label: "环面纽结", value: "torus-knot" },
              { label: "轨道球", value: "orbiting-spheres" },
              { label: "原生 WebGL2", value: "abyssal-well" },
            ],
            onChange: (value) => {
              setSceneTypeFilter(value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            },
          },
        ]}
        onRefresh={fetchGames}
        isLoading={isLoading}
        hasSelection={selectedRows.size > 0}
        selectedCount={selectedRows.size}
        batchActions={[{ label: "删除", icon: ToolbarIcons.Trash, onClick: handleBatchDelete, variant: "destructive", loading: isDeleting }]}
        primaryActions={[{ label: "新增游戏", icon: ToolbarIcons.Plus, onClick: () => setCreateDialogOpen(true) }]}
      />

      <DataTable
        columns={columns}
        data={games}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, pageIndex: page }))}
        getRowId={(game) => game.id}
        selectedRows={selectedRows}
        onRowSelectionChange={setSelectedRows}
        emptyTitle="暂无游戏"
        emptyDescription="还没有符合条件的游戏作品。"
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, game: open ? deleteDialog.game : null })}
        title="确认删除"
        description={`确定要删除游戏"${deleteDialog.game?.title || ""}"吗？关联的评分、评论数据也会一起删除。此操作无法撤销。`}
        confirmLabel="删除"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />

      <ConfirmDialog
        open={publishDialog.open}
        onOpenChange={(open) => setPublishDialog({ open, game: open ? publishDialog.game : null })}
        title="确认发布"
        description={`确定要发布游戏"${publishDialog.game?.title || ""}"吗？发布后前台可见。`}
        confirmLabel="发布"
        onConfirm={handlePublish}
        isLoading={isPublishing}
      />

      <TimeEditDialog
        open={timeDialog.open}
        onOpenChange={(open) => setTimeDialog({ open, game: open ? timeDialog.game : null })}
        title={timeDialog.game?.title || ""}
        createdAt={timeDialog.game?.createdAt}
        publishedAt={timeDialog.game?.publishedAt}
        isLoading={isSavingTime}
        onSave={handleTimeSave}
      />

      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        if (!isCreating && !isUploading) setCreateDialogOpen(open);
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>新增游戏</DialogTitle>
            <DialogDescription>创建后可继续在列表中调整发布时间或发布状态。</DialogDescription>
          </DialogHeader>
          <GameForm open={createDialogOpen} onSubmit={handleCreate} isLoading={isCreating} onUploadingChange={setIsUploading} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
