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
import { Separator } from "@/components/ui/separator";
import { Loader2, Send, Reply } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  userId: string;
  replies: Comment[];
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
  const [replyContent, setReplyContent] = useState("");

  // 获取评论列表
  useEffect(() => {
    async function fetchComments() {
      try {
        const response = await fetch(`/api/blog/${slug}/comments`);
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments);
        } else {
          toast.error("获取评论失败");
        }
      } catch (error) {
        console.error("获取评论失败:", error);
        toast.error("获取评论失败");
      } finally {
        setLoading(false);
      }
    }

    fetchComments();
  }, [slug]);

  // 提交评论
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    if (!session) {
      toast.error("请先登录");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/blog/${slug}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: commentContent }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([data.comment, ...comments]);
        setCommentContent("");
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
    if (!session) {
      toast.error("请先登录");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/blog/${slug}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: replyContent, parentId }),
      });

      if (response.ok) {
        const data = await response.json();
        // 更新评论列表，添加回复
        const updatedComments = comments.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...comment.replies, data.comment],
            };
          }
          return comment;
        });
        setComments(updatedComments);
        setReplyContent("");
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
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">发表评论</CardTitle>
        </CardHeader>
        <CardContent>
          {session ? (
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comment" className="text-white">评论内容</Label>
                <Textarea
                  id="comment"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="写下你的评论..."
                  rows={4}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting || !commentContent.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
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
          ) : (
            <p className="text-white/60">请 <a href="/signin" className="text-purple-400 hover:underline">登录</a> 后发表评论</p>
          )}
        </CardContent>
      </Card>

      {/* 评论列表 */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white">评论 ({comments.length})</h3>
        {comments.length === 0 ? (
          <p className="text-white/60">暂无评论，快来发表第一条评论吧！</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-4">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={session?.user?.image || ""} />
                      <AvatarFallback>{session?.user?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-white">{session?.user?.name || "用户"}</h4>
                        <span className="text-sm text-white/60">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-white/80">{comment.content}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                        >
                          <Reply className="w-4 h-4" />
                          回复
                        </button>
                      </div>

                      {/* 回复表单 */}
                      {replyingTo === comment.id && (
                        <div className="mt-4 space-y-3">
                          <Textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="写下你的回复..."
                            rows={2}
                            className="bg-white/5 border-white/10 text-white"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSubmitReply(comment.id)}
                              disabled={submitting || !replyContent.trim()}
                              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
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
                              }}
                              className="text-white/60 hover:text-white hover:bg-white/10"
                            >
                              取消
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* 回复列表 */}
                      {comment.replies.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-white/10 space-y-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium text-white/80">{session?.user?.name || "用户"}</h5>
                                <span className="text-xs text-white/60">
                                  {new Date(reply.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-white/70">{reply.content}</p>
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