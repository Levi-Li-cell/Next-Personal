"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useTransition } from "react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUp } from "@/lib/auth/client";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SignUpSchema, SignUpValues } from "./validate";
import InputStartIcon from "../components/input-start-icon";
import InputPasswordContainer from "../components/input-password";
import { cn } from "@/lib/utils";
import { AtSign, MailIcon, UserIcon } from "lucide-react";
import { GenderRadioGroup } from "../components/gender-radio-group";
import { TurnstileWidget } from "../components/turnstile-widget";

export default function SignUpForm() {
  const [isPending, startTransition] = useTransition();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileSiteKey = useMemo(() => String(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim(), []);
  const form = useForm<SignUpValues>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      gender: false
    },
  });

  function onSubmit(data: SignUpValues) {
    startTransition(async () => {
      console.log("submit data:", data);

      const guardResponse = await fetch("/api/auth/register-guard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      const guardResult = await guardResponse.json();

      if (!guardResult?.success) {
        toast.error(guardResult?.message || guardResult?.reason || "注册请求受限，请稍后再试");
        return;
      }

      if (guardResult?.blocked) {
        toast.error(guardResult?.message || guardResult?.reason || "注册请求受限，请稍后再试");
        return;
      }

      if (!turnstileSiteKey) {
        toast.error("验证码服务未配置，请联系管理员");
        return;
      }

      if (!captchaToken) {
        toast.error("请先完成验证码验证");
        return;
      }

      const captchaResponse = await fetch("/api/auth/captcha/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: captchaToken }),
      });
      const captchaResult = await captchaResponse.json();
      if (!captchaResult?.success) {
        toast.error(captchaResult?.error || "验证码校验失败，请重试");
        setCaptchaToken(null);
        return;
      }

      const response = await signUp.email(data);

      if (response.error) {
        console.log("SIGN_UP:", response.error.status);
        toast.error(response.error.message);
      } else {
        try {
          await fetch("/api/auth/register-guard", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: data.email }),
          });

          await fetch("/api/admin/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userName: data.name,
              userEmail: data.email,
              eventType: "user_signup",
              title: "新用户注册",
              content: `${data.name} 已完成注册`,
              link: "/admin/users",
              audience: "admin",
            }),
          });
        } catch (error) {
          console.error("Create signup notification failed:", error);
        }

        setCaptchaToken(null);
        redirect("/");
      }
    });
  }

  const getInputClassName = (fieldName: keyof SignUpValues) =>
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
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputStartIcon icon={UserIcon}>
                  <Input
                    placeholder="Name"
                    className={cn("peer ps-9", getInputClassName("name"))}
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputStartIcon icon={MailIcon}>
                  <Input
                    placeholder="Email"
                    className={cn("peer ps-9", getInputClassName("email"))}
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
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputStartIcon icon={AtSign}>
                  <Input
                    placeholder="Username"
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
                    className={cn("pe-9", getInputClassName("password"))}
                    placeholder="Password"
                    disabled={isPending}
                    {...field}
                  />
                </InputPasswordContainer>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputPasswordContainer>
                  <Input
                    className={cn("pe-9", getInputClassName("confirmPassword"))}
                    placeholder="Confirm Password"
                    disabled={isPending}
                    {...field}
                  />
                </InputPasswordContainer>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Gender */}
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <GenderRadioGroup
                value={field.value}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {turnstileSiteKey ? (
          <div className="rounded-md border border-white/10 p-2">
            <TurnstileWidget siteKey={turnstileSiteKey} onTokenChange={setCaptchaToken} />
          </div>
        ) : (
          <div className="text-xs text-destructive">验证码服务未配置，无法完成注册。</div>
        )}

        <Button type="submit" disabled={isPending} className="mt-5 w-full">
          Sign Up
        </Button>
      </form>
    </Form>
  );
}
