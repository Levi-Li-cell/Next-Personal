"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Coffee, Heart, ArrowLeft, Loader2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const presetAmounts = [9.9, 19.9, 39.9, 66, 99] as const;

export default function SponsorPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const [selectedAmount, setSelectedAmount] = useState<number>(presetAmounts[1]);
  const [paying, setPaying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    setPaymentStatus(String(params.get("status") || ""));
  }, []);

  const createCheckout = async () => {
    if (!session?.user?.id) {
      toast.error("请先登录后再赞助");
      return;
    }

    setPaying(true);
    try {
      const amountInCents = Math.round(selectedAmount * 100);
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountInCents }),
      });
      const data = await response.json();
      if (!data?.success || !data?.url) {
        toast.error(data?.error || "创建支付会话失败");
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("create checkout failed:", error);
      toast.error("创建支付会话失败，请稍后重试");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
        <Link href="/author" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" />
          返回作者页
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
          {paymentStatus === "success" ? (
            <div className="mb-5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-emerald-200 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              支付成功，感谢你的支持！
            </div>
          ) : null}
          {paymentStatus === "cancelled" ? (
            <div className="mb-5 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-3 text-yellow-200 text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              你已取消支付，稍后可以再次发起。
            </div>
          ) : null}

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Coffee className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">请作者喝杯奶茶</h1>
              <p className="text-white/60">你的支持会用于持续创作与开源分享</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mt-8">
            <div className="rounded-xl border border-white/10 bg-black/30 p-5">
              <h2 className="text-white font-semibold mb-3">推荐打赏金额</h2>
              <div className="flex flex-wrap gap-2">
                {presetAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setSelectedAmount(amount)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedAmount === amount
                        ? "bg-orange-500 text-white"
                        : "bg-orange-500/20 text-orange-300 hover:bg-orange-500/30"
                    }`}
                  >
                    RMB {amount}
                  </button>
                ))}
              </div>
              <p className="text-white/60 text-sm mt-4">
                支付方式：Stripe Checkout（国际卡支付）。
              </p>
            </div>

            <div className="rounded-xl border border-dashed border-white/20 bg-black/30 p-5 flex flex-col items-center justify-center gap-3">
              <div className="text-white/70 text-sm text-center">
                当前金额：<span className="text-orange-300 font-semibold">RMB {selectedAmount}</span>
              </div>
              <Button
                type="button"
                onClick={createCheckout}
                disabled={paying || sessionPending || !session?.user?.id}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
              >
                {paying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    正在跳转支付...
                  </>
                ) : session?.user?.id ? (
                  "使用 Stripe 支付"
                ) : (
                  "请先登录后赞助"
                )}
              </Button>
              <p className="text-white/40 text-xs text-center">
                点击后将跳转到 Stripe 安全收银台
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 text-pink-300">
            <Heart className="w-4 h-4" />
            <span className="text-sm">感谢支持，祝你每天都能写出优雅的代码。</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
