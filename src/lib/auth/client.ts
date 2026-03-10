import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";
import { nextCookies } from "better-auth/next-js";

const runtimeOrigin = typeof window !== "undefined" ? window.location.origin : undefined;
const isRuntimeLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const normalizeBaseUrl = (value?: string) => (value || "").trim().replace(/\/+$/, "");

const authBaseURL = isRuntimeLocalhost
  ? normalizeBaseUrl(runtimeOrigin) || "http://localhost:3000"
  : normalizeBaseUrl(process.env.NEXT_PUBLIC_AUTH_URL) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL) ||
    normalizeBaseUrl(runtimeOrigin) ||
    "http://localhost:3000";

export const { signIn, signUp, signOut, useSession, getSession } =
  createAuthClient({
    baseURL: authBaseURL,
    emailAndPassword: {
      enabled: true,
    },
    plugins: [usernameClient(), nextCookies()],
  });
