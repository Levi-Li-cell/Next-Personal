import { type Metadata } from "next";
import SignInForm from "./form";
import Link from "next/link";

export const metadata: Metadata = {
  title: "登录",
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="flex w-full flex-col rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl px-8 py-8 md:w-[420px] shadow-2xl">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-2">登录账户</h1>
        <p className="text-white/60 text-sm mb-4">欢迎回来！请登录您的账户</p>
        <SignInForm />
        <div className="flex items-center justify-center gap-2 mt-4">
          <small className="text-white/50">还没有账户?</small>
          <Link href={"/signup"} className="text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors">
            立即注册
          </Link>
        </div>
      </div>
    </div>
  );
}
