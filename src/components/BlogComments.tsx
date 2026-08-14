"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, Reply, Trash2 } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  userId: string | null;
  guestName: string | null;
  replies?: Comment[];
}

interface BlogCommentsProps {
  slug: string;
}

export default function BlogComments({ slug }: BlogCommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const [commentName, setCommentName] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [replyName, setReplyName] = useState("");

  // 获取评论列表
  useEffect(() => {
    async function fetchComments() {
      try {
        const response = await fetch(`/api/blog/${slug}/comments`);
        if (response.ok) {
          const data = await response.json();
          const normalizedComments: Comment[] = (data.comments || []).map((comment: Comment) => ({
            ...comment,
            replies: comment.replies || [],
          }));
          setComments(normalizedComments);
        }
      } catch (error) {
        console.error("获取评论失败:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchComments();
  }, [slug]);

  const getDisplayName = (comment: Comment) => {
    if (comment.guestName) return comment.guestName;
    return "用户";
  };

  // 提交评论
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/blog/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: commentContent,
          guestName: !session?.user?.id ? commentName.trim() || "匿名访客" : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([{ ...data.comment, replies: data.comment?.replies || [] }, ...comments]);
        setCommentContent("");
        setCommentName("");
        toast.success("评论成功");
      } else {
        const error = await response.json();
        toast.error(error.error || "评论失败");
      }
    } catch (error) {
      console.error("评论失败:", error);
      toast.error("评论失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 提交回复
  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/blog/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyContent,
          parentId,
          guestName: !session?.user?.id ? replyName.trim() || "匿名访客" : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedComments = comments.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), data.comment],
            };
          }
          return comment;
        });
        setComments(updatedComments);
        setReplyContent("");
        setReplyName("");
        setReplyingTo(null);
        toast.success("回复成功");
      } else {
        const error = await response.json();
        toast.error(error.error || "回复失败");
      }
    } catch (error) {
      console.error("回复失败:", error);
      toast.error("回复失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string, parentId?: string | null) => {
    try {
      const response = await fetch(`/api/blog/${slug}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "删除失败");
        return;
      }

      if (parentId) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === parentId
              ? {
                  ...comment,
                  replies: (comment.replies || []).filter((reply) => reply.id !== commentId),
                }
              : comment
          )
        );
      } else {
        setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      }

      toast.success("评论已删除");
    } catch (error) {
      console.error("删除评论失败:", error);
      toast.error("删除评论失败");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-12 space-y-6">
      {/* 评论表单 */}
      <Card className="bg-ink/5 border-ink/14">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-ink">发表评论</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitComment} className="space-y-4">
            {!session?.user?.id && (
              <div className="space-y-2">
                <Label htmlFor="commentName" className="text-ink">昵称（可选）</Label>
                <Input
                  id="commentName"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  placeholder='不填则显示"匿名访客"'
                  className="bg-ink/5 border-ink/14 text-ink placeholder:text-ink/60"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="comment" className="text-ink">评论内容</Label>
              <Textarea
                id="comment"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="写下你的评论..."
                rows={4}
                className="bg-ink/5 border-ink/14 text-ink"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting || !commentContent.trim()}
              className="bg-gradient-to-r from-accent to-peach text-black hover:from-accent/90 hover:to-peach/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  发表评论
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 评论列表 */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-ink">评论 ({comments.length})</h3>
        {comments.length === 0 ? (
          <p className="text-ink/60">暂无评论，快来发表第一条评论吧！</p>
        ) : (
          comments.map((comment) => (
          <div key={comment.id} className="space-y-4">
            <Card className="bg-ink/5 border-ink/14">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={undefined} />
                    <AvatarFallback>{getDisplayName(comment).charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-ink">{getDisplayName(comment)}</h4>
                      <span className="text-sm text-ink/60">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-ink/80">{comment.content}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="text-sm text-accent hover:text-accent/80 flex items-center gap-1"
                      >
                        <Reply className="w-4 h-4" />
                        回复
                      </button>
                      {session?.user?.id && session.user.id === comment.userId && (
                        <button
                          onClick={() => handleDeleteComment(comment.id, null)}
                          className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          删除
                        </button>
                      )}
                    </div>

                    {/* 回复表单 */}
                    {replyingTo === comment.id && (
                      <div className="mt-4 space-y-3">
                        {!session?.user?.id && (
                          <Input
                            value={replyName}
                            onChange={(e) => setReplyName(e.target.value)}
                            placeholder="昵称（可选）"
                            className="bg-ink/5 border-ink/14 text-ink placeholder:text-ink/60"
                          />
                        )}
                        <Textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="写下你的回复..."
                          rows={2}
                          className="bg-ink/5 border-ink/14 text-ink"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSubmitReply(comment.id)}
                            disabled={submitting || !replyContent.trim()}
                            className="bg-gradient-to-r from-accent to-peach text-black hover:from-accent/90 hover:to-peach/90"
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                提交中...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                回复
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent("");
                              setReplyName("");
                            }}
                            className="text-ink/60 hover:text-ink hover:bg-ink/10"
                          >
                            取消
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* 回复列表 */}
                    {(comment.replies?.length || 0) > 0 && (
                      <div className="mt-4 pl-4 border-l-2 border-ink/14 space-y-3">
                        {(comment.replies || []).map((reply) => (
                          <div key={reply.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-ink/80">{getDisplayName(reply)}</h5>
                              <span className="text-xs text-ink/60">
                                {new Date(reply.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-ink/70">{reply.content}</p>
                            {session?.user?.id && session.user.id === reply.userId && (
                              <button
                                onClick={() => handleDeleteComment(reply.id, comment.id)}
                                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                删除
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          ))
        )}
      </div>
    </div>
  );
}
