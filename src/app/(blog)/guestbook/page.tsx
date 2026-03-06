"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Loader2, MessageSquareText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface GuestbookMessage {
  id: string;
  name: string;
  content: string;
  contact: string | null;
  status: string;
  createdAt: string;
}

export default function GuestbookPage() {
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [form, setForm] = useState({
    name: "",
    contact: "",
    content: "",
  });

  const fetchMessages = async (targetPage = 1) => {
    try {
      const response = await fetch(`/api/guestbook?status=public&page=${targetPage}&limit=10`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
        if (data.pagination) {
          setPagination(data.pagination);
          setPage(data.pagination.page || targetPage);
        }
      } else {
        toast.error(data.error || "获取留言失败");
      }
    } catch (error) {
      console.error("Failed to fetch guestbook:", error);
      toast.error("获取留言失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(1);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

        if (data.success) {
          setForm({ name: "", contact: "", content: "" });
          await fetchMessages(1);
          toast.success(
            data.data?.status === "flagged"
              ? "留言已提交，但被标记为风险内容，前台会附带风险提醒"
              : "留言成功，感谢你的建议与鼓励"
          );
        } else {
        toast.error(data.error || "留言失败");
      }
    } catch (error) {
      console.error("Failed to create guestbook message:", error);
      toast.error("留言失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            留言板
          </span>
        </h1>
        <p className="text-white/60 text-lg">欢迎留下你的建议、想法或合作意向</p>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <Card className="bg-white/5 border-white/10 h-fit">
          <CardHeader>
            <CardTitle className="text-white">发布留言</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">昵称</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入你的昵称"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact" className="text-white">联系方式（可选）</Label>
                <Input
                  id="contact"
                  value={form.contact}
                  onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))}
                  placeholder="微信 / 邮箱 / 电话"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-white">留言内容</Label>
                <Textarea
                  id="content"
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="想说点什么？"
                  rows={5}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    提交留言
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-purple-400" />
            最新留言 ({messages.length})
          </h2>

          {loading ? (
            <div className="flex items-center gap-2 text-white/60 py-8">
              <Loader2 className="w-5 h-5 animate-spin" />
              正在加载留言...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-white/60 py-10">暂时还没有留言，欢迎抢沙发。</div>
          ) : (
            <div className="space-y-3">
              {messages.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-medium">{item.name}</div>
                    <div className="flex items-center gap-2">
                      {item.status === "flagged" ? (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-400/40">
                          风险提醒
                        </span>
                      ) : null}
                      <div className="text-xs text-white/50">
                        {new Date(item.createdAt).toLocaleString("zh-CN")}
                      </div>
                    </div>
                  </div>
                  <p className="text-white/80 whitespace-pre-wrap break-words">{item.content}</p>
                  {item.status === "flagged" ? (
                    <div className="text-xs text-red-300/90 mt-3">
                      该留言被系统标记为可能存在风险信息，请谨慎识别，勿直接联系或转账。
                    </div>
                  ) : null}
                </motion.div>
              ))}

              <div className="pt-2 flex items-center justify-between text-sm text-white/60">
                <span>
                  第 {pagination.page} / {Math.max(pagination.totalPages, 1)} 页 · 共 {pagination.total} 条
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1 || loading}
                    onClick={() => fetchMessages(page - 1)}
                    className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                  >
                    上一页
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages || loading}
                    onClick={() => fetchMessages(page + 1)}
                    className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                  >
                    下一页
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
