import { z } from "zod";
import { isSafeGameUrl, isUploadedGameHtmlUrl } from "./game-assets";

export const GAME_SCENE_TYPES = ["html-game", "crystal-cluster", "wave-field", "torus-knot", "orbiting-spheres", "abyssal-well"] as const;

const optionalUrl = z.string().trim().max(2048).refine((value) => !value || isSafeGameUrl(value), "请输入有效 URL 或站内绝对路径").nullable().optional();

export const gameInputSchema = z.object({
  title: z.string().trim().min(1, "请输入游戏名称").max(100),
  slug: z.string().trim().min(1).max(60).regex(/^[a-z0-9\u4e00-\u9fa5]+(?:-[a-z0-9\u4e00-\u9fa5]+)*$/, "URL Slug 格式不正确"),
  tagline: z.string().trim().max(160).nullable().optional(),
  description: z.string().trim().min(1, "请输入游戏说明").max(5000),
  authorName: z.string().trim().min(1).max(80).default("李伟"),
  authorLink: optionalUrl,
  tags: z.array(z.string().trim().min(1).max(100)).max(12).default([]),
  coverImage: optionalUrl,
  coverGradient: z.string().trim().max(500).nullable().optional(),
  sceneType: z.enum(GAME_SCENE_TYPES).default("crystal-cluster"),
  sceneConfig: z.record(z.string(), z.unknown()).default({}),
  controlsHint: z.array(z.string().trim().min(1).max(500)).max(12).default([]),
  status: z.enum(["draft", "published"]).default("draft"),
}).superRefine((data, ctx) => {
  if (data.sceneType === "html-game" && !isUploadedGameHtmlUrl(data.sceneConfig.htmlUrl)) {
    ctx.addIssue({ code: "custom", path: ["sceneConfig", "htmlUrl"], message: "请先上传 HTML 游戏文件" });
  }
});
