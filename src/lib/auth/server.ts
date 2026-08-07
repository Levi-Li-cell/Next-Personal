import { db } from "@/db";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { memoryAdapter } from "better-auth/adapters/memory";
import { restrictedUsernames } from "./usernames";

const normalizeBaseUrl = (value?: string) => (value || "").trim().replace(/\/+$/, "");

const env = (name: string) => {
  const value = process.env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

// Prefer BETTER_AUTH_URL for server-side configuration.
// If it's not provided, Better Auth will infer the base URL from the request
// (x-forwarded-host/proto on Vercel, or request.url locally).
const configuredBaseURL = normalizeBaseUrl(
  env("BETTER_AUTH_URL") ?? env("NEXT_PUBLIC_BETTER_AUTH_URL"),
);

const googleClientId = env("GOOGLE_CLIENT_ID");
const googleClientSecret = env("GOOGLE_CLIENT_SECRET");

const shouldUseMemoryAuthDb =
  process.env.NODE_ENV !== "production" &&
  (process.env.BETTER_AUTH_USE_MEMORY_DB === "1" ||
    process.env.BETTER_AUTH_USE_MEMORY_DB === "true");

const memoryDb: Record<string, any[]> = {};

export const auth = betterAuth({
  ...(configuredBaseURL ? { baseURL: configuredBaseURL } : {}),
  database: shouldUseMemoryAuthDb
    ? memoryAdapter(memoryDb)
    : drizzleAdapter(db, {
        provider: "pg",
      }),
  verification: {
    disableCleanup: true,
  },
  onAPIError: {
    throw: process.env.NODE_ENV !== "production",
  },
  logger:
    process.env.NODE_ENV !== "production"
      ? {
          level: "debug",
        }
      : undefined,
  plugins: [username({
    minUsernameLength: 4,
    maxUsernameLength: 10,
    usernameValidator: (value) => !restrictedUsernames.includes(value),
    usernameNormalization: (value) => value.toLowerCase(),
  })],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    ...(googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            prompt: "select_account",
          },
        }
      : {}),
  },
  trustedOrigins: [
    normalizeBaseUrl(env("NEXT_PUBLIC_BASE_URL")),
    normalizeBaseUrl(env("NEXT_PUBLIC_FRONTEND_URL")),
    normalizeBaseUrl(env("NEXT_PUBLIC_AUTH_URL")),
  ].filter(Boolean) as string[],
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        required: false,
        input: false,
      },
      gender: {
        type: "boolean",
        defaultValue: false,
        required: false,
        input: false,
      },
    },
  },
});
