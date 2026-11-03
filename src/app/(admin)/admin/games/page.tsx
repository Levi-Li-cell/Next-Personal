"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { EyeOff, Send } from "lucide-react";
import type { InteractiveWorkType } from "@/db/schema/game";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ConfirmDialog, PageHeader, TimeEditDialog, Toolbar, ToolbarIcons } from "@/components/admin/common";
import { getGameColumns, type GameStatus } from "@/components/admin/games/game-table";
import { GameForm, type GameFormValues } from "@/components/admin/games/game-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isUploadedGameHtmlUrl } from "@/lib/game-assets";

interface StatusDialogState {
  open: boolean;
  /** 单个游戏（行内操作）时非空；批量操作时为空 */
  game: InteractiveWorkType | null;
  /** 批量操作时非空 */
  ids?: string[];
  status: GameStatus | null;
}

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
  const [statusDialog, setStatusDialog] = useState<StatusDialogState>({ open: false, game: null, ids: undefined, status: null });
  const [timeDialog, setTimeDialog] = useState<{ open: boolean; game: InteractiveWorkType | null }>({ open: false, game: null });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; game: InteractiveWorkType | null }>({ open: false, game: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [isSavingTime, setIsSavingTime] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  /** 对话框中已上传、但尚未随请求保存的 Blob 地址；保存成功即置空，取消/移除时清理 */
  const pendingBlobUrlRef = useRef<string | null>(null);

  const cleanupUploadedBlob = useCallback((url: string) => {
    void fetch(`/api/admin/games/upload?url=${encodeURIComponent(url)}`, { method: "DELETE" }).catch(() => {
      // 清理失败不阻塞交互（最坏情况回到旧行为：留下孤儿文件）
    });
  }, []);

  const handleUploadedChange = useCallback(
    (url: string | null) => {
      const previous = pendingBlobUrlRef.current;
      pendingBlobUrlRef.current = url;
      if (previous && previous !== url) cleanupUploadedBlob(previous);
    },
    [cleanupUploadedBlob],
  );

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

  /** 单个或批量调整发布状态（草稿 ↔ 发布），统一走批量 PATCH 接口 */
  const handleStatusConfirm = async () => {
    if (!statusDialog.status) return;
    const ids = statusDialog.ids ?? (statusDialog.game ? [statusDialog.game.id] : []);
    if (ids.length === 0) return;
    setIsStatusUpdating(true);
    try {
      const response = await fetch("/api/admin/games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status: statusDialog.status }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "操作失败");
      toast.success(statusDialog.status === "published" ? `已发布 ${ids.length} 个游戏` : `已将 ${ids.length} 个游戏转为草稿`);
      setSelectedRows(new Set());
      setStatusDialog({ open: false, game: null, ids: undefined, status: null });
      fetchGames();
    } catch (error) {
      console.error("Failed to update game status:", error);
      toast.error(error instanceof Error ? error.message : "更新发布状态失败");
    } finally {
      setIsStatusUpdating(false);
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

  /** 新增：POST /api/admin/games */
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
      // 记录已随作品保存，Blob 交给数据库引用，不再清理
      pendingBlobUrlRef.current = null;
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

  /** 编辑：PUT /api/admin/games/[id]，保存成功后清理被替换的旧 HTML Blob */
  const handleEdit = async (values: GameFormValues) => {
    const game = editDialog.game;
    if (!game) return;
    setIsEditing(true);
    try {
      const response = await fetch(`/api/admin/games/${game.id}`, {
        method: "PUT",
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
      if (!result.success) throw new Error(result.error || "保存失败");

      toast.success("游戏已更新");
      setEditDialog({ open: false, game: null });
      // 新上传的 Blob 已被数据库引用；若替换了旧的 HTML 文件则清理旧文件
      pendingBlobUrlRef.current = null;
      const oldHtmlUrl = game.sceneType === "html-game" && typeof game.sceneConfig?.htmlUrl === "string"
        ? game.sceneConfig.htmlUrl
        : null;
      if (oldHtmlUrl && isUploadedGameHtmlUrl(oldHtmlUrl) && values.sceneType === "html-game" && oldHtmlUrl !== values.htmlUrl) {
        cleanupUploadedBlob(oldHtmlUrl);
      }
      fetchGames();
    } catch (error) {
      console.error("Failed to edit game:", error);
      toast.error(error instanceof Error ? error.message : "保存游戏失败");
    } finally {
      setIsEditing(false);
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

  const handleBatchStatus = (status: GameStatus) => {
    if (selectedRows.size === 0) return;
    setStatusDialog({ open: true, game: null, ids: Array.from(selectedRows), status });
  };

  /** 编辑对话框的初始表单值（由被编辑游戏派生） */
  const editFormValues = useMemo<GameFormValues | null>(() => {
    const game = editDialog.game;
    if (!game) return null;
    const sceneConfig = game.sceneConfig ?? {};
    return {
      title: game.title ?? "",
      slug: game.slug ?? "",
      tagline: game.tagline ?? "",
      description: game.description ?? "",
      sceneType: game.sceneType as GameFormValues["sceneType"],
      sceneConfig: game.sceneType === "html-game" ? "" : Object.keys(sceneConfig).length ? JSON.stringify(sceneConfig, null, 2) : "",
      htmlUrl: game.sceneType === "html-game" && typeof sceneConfig.htmlUrl === "string" ? sceneConfig.htmlUrl : "",
      coverImage: game.coverImage ?? "",
      coverGradient: game.coverGradient ?? "",
      tags: (game.tags ?? []).join(", "),
      controlsHint: (game.controlsHint ?? []).join(", "),
      authorName: game.authorName ?? "",
      authorLink: game.authorLink ?? "",
      status: game.status === "published" ? "published" : "draft",
    };
  }, [editDialog.game]);

  const columns: Column<InteractiveWorkType>[] = [
    { key: "select", header: "", width: "40px" },
    ...getGameColumns({
      onEdit: (game) => setEditDialog({ open: true, game }),
      onEditTime: (game) => setTimeDialog({ open: true, game }),
      onDelete: (game) => setDeleteDialog({ open: true, game }),
      onSetStatus: (game, status) => setStatusDialog({ open: true, game, ids: undefined, status }),
    }),
  ];

  const statusIsPublish = statusDialog.status === "published";

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
        batchActions={[
          { label: "批量发布", icon: <Send className="h-4 w-4" />, onClick: () => handleBatchStatus("published"), loading: isStatusUpdating },
          { label: "转为草稿", icon: <EyeOff className="h-4 w-4" />, onClick: () => handleBatchStatus("draft"), loading: isStatusUpdating },
          { label: "删除", icon: ToolbarIcons.Trash, onClick: handleBatchDelete, variant: "destructive", loading: isDeleting },
        ]}
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
        open={statusDialog.open}
        onOpenChange={(open) => {
          if (!open && !isStatusUpdating) setStatusDialog({ open: false, game: null, ids: undefined, status: null });
        }}
        title={statusIsPublish ? "确认发布" : "确认转为草稿"}
        description={
          statusDialog.ids
            ? statusIsPublish
              ? `确定要发布选中的 ${statusDialog.ids.length} 个游戏吗？发布后前台可见。`
              : `确定要将选中的 ${statusDialog.ids.length} 个游戏转为草稿吗？转为草稿后前台不可见。`
            : statusIsPublish
              ? `确定要发布游戏"${statusDialog.game?.title || ""}"吗？发布后前台可见。`
              : `确定要将游戏"${statusDialog.game?.title || ""}"转为草稿吗？转为草稿后前台不可见。`
        }
        confirmLabel={statusIsPublish ? "发布" : "转为草稿"}
        onConfirm={handleStatusConfirm}
        isLoading={isStatusUpdating}
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
        if (!open && pendingBlobUrlRef.current) {
          // 未保存就关闭对话框：清理已上传的孤儿 HTML
          cleanupUploadedBlob(pendingBlobUrlRef.current);
          pendingBlobUrlRef.current = null;
        }
        if (!isCreating && !isUploading) setCreateDialogOpen(open);
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>新增游戏</DialogTitle>
            <DialogDescription>创建后可继续在列表中调整发布时间或发布状态。</DialogDescription>
          </DialogHeader>
          <GameForm open={createDialogOpen} onSubmit={handleCreate} isLoading={isCreating} onUploadingChange={setIsUploading} onUploadedChange={handleUploadedChange} />
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog.open} onOpenChange={(open) => {
        if (!open && pendingBlobUrlRef.current) {
          // 未保存就关闭对话框：清理本次新上传的孤儿 HTML
          cleanupUploadedBlob(pendingBlobUrlRef.current);
          pendingBlobUrlRef.current = null;
        }
        if (!isEditing && !isUploading) setEditDialog((prev) => ({ ...prev, open }));
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>编辑游戏</DialogTitle>
            <DialogDescription>修改后立即生效；发布状态与发布时间可随时在列表中调整。</DialogDescription>
          </DialogHeader>
          {editFormValues && (
            <GameForm
              key={editDialog.game?.id ?? "edit"}
              open={editDialog.open}
              initialValues={editFormValues}
              submitLabel="保存修改"
              onSubmit={handleEdit}
              isLoading={isEditing}
              onUploadingChange={setIsUploading}
              onUploadedChange={handleUploadedChange}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
