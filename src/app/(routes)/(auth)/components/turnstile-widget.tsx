"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  siteKey: string;
  onTokenChange: (token: string | null) => void;
  resetKey?: number;
}

let scriptLoadingPromise: Promise<void> | null = null;

function loadScript() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  const loading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src*="challenges.cloudflare.com/turnstile/v0/api.js"]');
    const script = existing || document.createElement("script");
    const cleanup = () => {
      window.clearTimeout(timeout);
      script.removeEventListener("load", loaded);
      script.removeEventListener("error", failed);
    };
    const failed = () => {
      cleanup();
      script.remove();
      reject(new Error("turnstile script unavailable"));
    };
    const loaded = () => {
      if (!window.turnstile) { failed(); return; }
      cleanup();
      resolve();
    };
    const timeout = window.setTimeout(failed, 15000);
    script.addEventListener("load", loaded, { once: true });
    script.addEventListener("error", failed, { once: true });
    if (!existing) {
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });
  scriptLoadingPromise = loading.catch((error) => {
    scriptLoadingPromise = null;
    throw error;
  });
  return scriptLoadingPromise;
}

function errorMessage(code: string) {
  if (code === "110200") return "当前域名未获验证码授权，请联系管理员检查域名配置。";
  if (code === "110100" || code === "110110") return "验证码站点公钥无效，请联系管理员。";
  if (code === "200500" || code === "SCRIPT_LOAD_FAILED") return "验证码资源加载失败，请重试。";
  if (code === "110600" || code === "110620" || code === "TIMEOUT") return "验证已超时，请重试。";
  return "人机验证未完成，请重试。";
}

export function TurnstileWidget({ siteKey, onTokenChange, resetKey = 0 }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fail = (code: string) => {
      if (!mounted) return;
      onTokenChange(null);
      setErrorCode(code);
    };

    loadScript()
      .then(() => {
        if (!mounted || !containerRef.current || !window.turnstile) {
          return;
        }

        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action: "signup",
          callback: (token: string) => {
            if (!mounted) return;
            setErrorCode(null);
            onTokenChange(token);
          },
          "expired-callback": () => fail("EXPIRED"),
          "timeout-callback": () => fail("TIMEOUT"),
          "error-callback": (code: string) => { fail(String(code)); return true; },
          retry: "never",
          "refresh-expired": "auto",
          "refresh-timeout": "auto",
          theme: "auto",
          size: "flexible",
        });
      })
      .catch(() => {
        fail("SCRIPT_LOAD_FAILED");
      });

    return () => {
      mounted = false;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onTokenChange, attempt, resetKey]);

  return (
    <div className="min-w-0 space-y-2">
      <div ref={containerRef} className="min-h-[65px] w-full" />
      {errorCode && (
        <div role="alert" className="space-y-2 text-xs text-destructive">
          <p>{errorMessage(errorCode)}<span className="ml-1 break-all font-mono">({errorCode})</span></p>
          <Button type="button" size="sm" variant="outline" onClick={() => {
            onTokenChange(null);
            setErrorCode(null);
            setAttempt((value) => value + 1);
          }}><RotateCcw className="mr-1 size-3.5" />重新验证</Button>
        </div>
      )}
    </div>
  );
}
