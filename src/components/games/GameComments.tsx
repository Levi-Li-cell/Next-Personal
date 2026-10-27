"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Heart, Loader2, MessageCircleReply, Send } from "lucide-react";
import { useSession } from "@/lib/auth/client";
import { getVisitorVoterKey } from "@/lib/games-client";
import type { CommentNode } from "@/lib/games-types";

interface GameCommentsProps {
  workId: string;
  /** 评论发表成功后联动侧边栏“讨论”卡片 */
  onCommentCountChange?: (delta: number) => void;
}

/** 根评论分页大小：详情页首屏只拉一页，往下滚动按需加载 */
const COMMENTS_PAGE_SIZE = 10;

function formatTime(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return date.toLocaleDateString("zh-CN");
}

const AVATAR_COLORS = ["bg-accent/20 text-accent", "bg-sage/20 text-sage", "bg-peach/20 text-peach"];

function CommentAvatar({ name }: { name: string }) {
  const initial = (name || "匿").slice(0, 1).toUpperCase();
  const color = AVATAR_COLORS[name.length % AVATAR_COLORS.length];
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${color}`}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

/** 单条评论渲染成本不低（头像/时间/点赞/回复树），memo 化后列表追加页不影响已有节点 */
const CommentItem = memo(function CommentItem({
  comment,
  voterKey,
  onReply,
  onLike,
  replyingTo,
  replyForm,
  nested = false,
}: {
  comment: CommentNode;
  voterKey: string;
  onReply: (comment: CommentNode) => void;
  onLike: (comment: CommentNode, nested: boolean, parentId?: string) => void;
  replyingTo: string | null;
  replyForm: React.ReactNode;
  nested?: boolean;
}) {
  return (
    <div className={nested ? "border-l-2 border-ink/10 pl-4" : ""}>
      <div className="flex gap-3">
        <CommentAvatar name={comment.displayName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-medium text-ink">{comment.displayName}</span>
            <span className="text-xs text-ink/45">{formatTime(comment.createdAt)}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-ink/75">{comment.content}</p>
          <div className="mt-2 flex items-center gap-4">
            <button
              type="button"
              onClick={() => onLike(comment, nested, nested ? undefined : comment.id)}
              className={`inline-flex items-center gap-1 text-xs transition-colors ${
                comment.likedByMe ? "text-peach" : "text-ink/50 hover:text-ink"
              }`}
              aria-label={comment.likedByMe ? "取消点赞" : "点赞"}
            >
              <Heart className="h-3.5 w-3.5" fill={comment.likedByMe ? "currentColor" : "none"} aria-hidden="true" />
              {comment.likeCount > 0 ? comment.likeCount : "点赞"}
            </button>
            {!nested && (
              <button
                type="button"
                onClick={() => onReply(comment)}
                className="inline-flex items-center gap-1 text-xs text-ink/50 transition-colors hover:text-ink"
              >
                <MessageCircleReply className="h-3.5 w-3.5" aria-hidden="true" />
                回复
              </button>
            )}
          </div>

          {replyingTo === comment.id && replyForm}

          {comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  voterKey={voterKey}
                  onReply={onReply}
                  onLike={onLike}
                  replyingTo={replyingTo}
                  replyForm={null}
                  nested
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

/** 评论区：输入框 + 一层回复树列表（根评论分页加载），支持点赞/回复，发表后联动“讨论”计数 */
export default function GameComments({ workId, onCommentCountChange }: GameCommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [rootTotal, setRootTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [guestName, setGuestName] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [voterKey, setVoterKey] = useState("guest:ssr");

  useEffect(() => {
    setVoterKey(getVisitorVoterKey());
  }, []);

  const applyPage = useCallback((data: { list: CommentNode[]; hasMore: boolean; rootTotal: number; page: number }, append: boolean) => {
    setComments((prev) => (append ? [...prev, ...data.list] : data.list));
    setHasMore(data.hasMore);
    setRootTotal(data.rootTotal);
    setPage(data.page);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchComments() {
      try {
        const key = getVisitorVoterKey();
        const response = await fetch(`/api/games/${workId}/comments?voter=${encodeURIComponent(key)}&page=1&limit=${COMMENTS_PAGE_SIZE}`);
        const result = await response.json();
        if (!cancelled && result.success && result.data) {
          applyPage(result.data, false);
        }
      } catch (error) {
        console.error("获取评论失败:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchComments();
    return () => {
      cancelled = true;
    };
  }, [workId, applyPage]);

  /** 追加下一页根评论（回复随根评论一并下发） */
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const key = getVisitorVoterKey();
      const response = await fetch(`/api/games/${workId}/comments?voter=${encodeURIComponent(key)}&page=${page + 1}&limit=${COMMENTS_PAGE_SIZE}`);
      const result = await response.json();
      if (result.success && result.data) {
        applyPage(result.data, true);
      }
    } catch (error) {
      console.error("加载更多评论失败:", error);
      toast.error("加载更多失败，请稍后重试");
    } finally {
      setLoadingMore(false);
    }
  }, [applyPage, hasMore, loadingMore, page, workId]);

  const submitComment = async (payload: { content: string; parentId?: string }) => {
    const body = {
      content: payload.content,
      parentId: payload.parentId,
      guestName: !session?.user?.id ? guestName.trim() || undefined : undefined,
      voterKey,
    };
    const response = await fetch(`/api/games/${workId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || "发表失败");
    }
    return result.data as { comment: CommentNode; commentCount: number };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const data = await submitComment({ content: content.trim() });
      setComments((prev) => [{ ...data.comment, replies: [] }, ...prev]);
      setContent("");
      onCommentCountChange?.(1);
      toast.success("评论已发表");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发表失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!replyContent.trim() || submitting) return;
    setSubmitting(true);
    try {
      const data = await submitComment({ content: replyContent.trim(), parentId });
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === parentId
            ? { ...comment, replies: [...comment.replies, { ...data.comment, replies: [] }] }
            : comment,
        ),
      );
      setReplyContent("");
      setReplyingTo(null);
      onCommentCountChange?.(1);
      toast.success("回复已发表");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "回复失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (comment: CommentNode, nested: boolean, parentId?: string) => {
    // 乐观切换，失败回滚
    const applyPatch = (patch: { likedByMe: boolean; likeCount: number }) => {
      setComments((prev) =>
        prev.map((root) => {
          if (!nested && root.id === comment.id) return { ...root, ...patch };
          if (nested && root.id === parentId) {
            return { ...root, replies: root.replies.map((reply) => (reply.id === comment.id ? { ...reply, ...patch } : reply)) };
          }
          return root;
        }),
      );
    };
    const optimistic = {
      likedByMe: !comment.likedByMe,
      likeCount: Math.max(0, comment.likeCount + (comment.likedByMe ? -1 : 1)),
    };
    applyPatch(optimistic);
    try {
      const response = await fetch(`/api/games/${workId}/comments/${comment.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterKey }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "操作失败");
      applyPatch({ likedByMe: result.data.liked, likeCount: result.data.likeCount });
    } catch (error) {
      applyPatch({ likedByMe: comment.likedByMe, likeCount: comment.likeCount });
      toast.error(error instanceof Error ? error.message : "操作失败，请稍后重试");
    }
  };

  const replyForm = (parentId: string) => (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleReplySubmit(parentId);
      }}
      className="mt-3 rounded-xl border border-ink/12 bg-ink/[0.04] p-3"
    >
      <textarea
        value={replyContent}
        onChange={(event) => setReplyContent(event.target.value)}
        placeholder={`回复 ${comments.find((c) => c.id === parentId)?.displayName ?? ""}…`}
        rows={2}
        maxLength={2000}
        className="w-full resize-none rounded-lg border border-ink/12 bg-white/70 px-3 py-2 text-sm text-ink placeholder:text-ink/35 focus:border-accent/60 focus:outline-none"
      />
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setReplyingTo(null);
            setReplyContent("");
          }}
          className="rounded-lg px-3 py-1.5 text-xs text-ink/55 transition-colors hover:text-ink"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={submitting || !replyContent.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs text-white transition-opacity disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          回复
        </button>
      </div>
    </form>
  );

  return (
    <div className="flex h-full flex-col">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink">发表评论</h2>
          {!session?.user?.id && (
            <input
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              placeholder="你的昵称（可选）"
              maxLength={24}
              className="w-40 rounded-lg border border-ink/12 bg-white/70 px-3 py-1.5 text-xs text-ink placeholder:text-ink/35 focus:border-accent/60 focus:outline-none"
            />
          )}
        </div>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={session?.user?.id ? "说说你对这个交互场景的看法…" : "登录后评论会带上你的账号昵称，游客也可以直接评论…"}
          rows={3}
          maxLength={2000}
          className="mt-3 w-full resize-none rounded-xl border border-ink/12 bg-white/70 px-4 py-3 text-sm leading-6 text-ink placeholder:text-ink/35 focus:border-accent/60 focus:outline-none"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-ink/40">{content.length}/2000</span>
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            发表
          </button>
        </div>
      </form>

      <div className="mt-5 min-h-0 flex-1">
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-ink/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            评论加载中…
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/14 py-10 text-center text-sm text-ink/45">
            还没有评论，来抢第一个沙发。
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  voterKey={voterKey}
                  onReply={(target) => {
                    setReplyingTo(replyingTo === target.id ? null : target.id);
                    setReplyContent("");
                  }}
                  onLike={handleLike}
                  replyingTo={replyingTo}
                  replyForm={replyForm(comment.id)}
                />
              ))}
            </div>
            {hasMore && (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink/16 py-3 text-sm text-ink/55 transition-colors hover:border-accent/40 hover:text-accent disabled:opacity-60"
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
                加载更多评论（已显示 {comments.length}/{rootTotal} 条）
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
