"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SignInSchema, SignInValues } from "./validate";
import InputStartIcon from "../components/input-start-icon";
import InputPasswordContainer from "../components/input-password";
import { cn } from "@/lib/utils";
import { AtSign, Chrome, Loader2 } from "lucide-react";

export default function SignInForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  function onSubmit(data: SignInValues) {
    startTransition(async () => {
      try {
        const redirectTo = new URLSearchParams(window.location.search).get("redirect");
        const safeRedirect = redirectTo && redirectTo.startsWith("/") ? redirectTo : null;

        // 判断输入是邮箱还是用户名
        const isEmail = data.username.includes("@");

        let response;
        if (isEmail) {
          // 使用邮箱登录
          response = await signIn.email({
            email: data.username,
            password: data.password
          });
        } else {
          // 使用用户名登录
          response = await signIn.username({
            username: data.username,
            password: data.password
          });
        }

        if (response.error) {
          console.log("SIGN_IN_ERROR:", response.error);
          toast.error(response.error.message || "登录失败");
        } else {
          // 存储用户信息到 localStorage
          if (response.data?.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }

          toast.success("登录成功");

          // 检查是否为管理员
          try {
            const checkRes = await fetch("/api/check-admin", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: response.data?.user?.id,
                username: response.data?.user?.name
              }),
            });
            const checkData = await checkRes.json();

            if (safeRedirect) {
              router.push(safeRedirect);
              return;
            }

            if (checkData.isAdmin) {
              router.push("/admin");
            } else {
              router.push("/author");
            }
          } catch (e) {
            console.error("Check admin error:", e);
            router.push(safeRedirect || "/author");
          }
        }
      } catch (error) {
        console.error("SignIn error:", error);
        toast.error("登录失败，请稍后重试");
      }
    });
  }

  const handleGoogleSignIn = () => {
    startTransition(async () => {
      try {
        await signIn.social({
          provider: "google",
          callbackURL: "/",
        });
      } catch (error) {
        console.error("Google sign in error:", error);
        toast.error("Google 登录失败");
      }
    });
  };

  const getInputClassName = (fieldName: keyof SignInValues) =>
    cn(
      form.formState.errors[fieldName] &&
      "border-destructive/80 text-destructive focus-visible:border-destructive/80 focus-visible:ring-destructive/20",
    );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="z-50 my-8 flex w-full flex-col gap-5"
      >
        {/* Google Sign In Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={handleGoogleSignIn}
          disabled={isPending}
        >
          <Chrome className="w-5 h-5" />
          <span>使用 Google 登录</span>
        </Button>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-foreground/10"></div>
          <span className="mx-4 flex-shrink text-sm text-muted-foreground">或</span>
          <div className="flex-grow border-t border-foreground/10"></div>
        </div>

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputStartIcon icon={AtSign}>
                  <Input
                    placeholder="用户名或邮箱"
                    className={cn("peer ps-9", getInputClassName("username"))}
                    disabled={isPending}
                    {...field}
                  />
                </InputStartIcon>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputPasswordContainer>
                  <Input
                    id="input-23"
                    className={cn("pe-9", getInputClassName("password"))}
                    placeholder="密码"
                    disabled={isPending}
                    type="password"
                    {...field}
                  />
                </InputPasswordContainer>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="mt-5 w-full">
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              登录中...
            </>
          ) : (
            "登录"
          )}
        </Button>
      </form>
    </Form>
  );
}
