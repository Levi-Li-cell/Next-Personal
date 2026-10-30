"use client";

import { useEffect, useRef, useState } from "react";
import { FileCode2, Loader2, Play, Upload, X } from "lucide-react";
import HtmlGame from "@/components/games/HtmlGame";
import { isSafeGameUrl, isUploadedGameHtmlUrl, validateGameHtmlFile } from "@/lib/game-assets";
import { GAME_SCENE_TYPES as SCENE_TYPES } from "@/lib/game-input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const sceneConfigIsValid = (value: string) => {
  if (!value.trim()) return true;
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
  } catch {
    return false;
  }
};

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => !value || isSafeGameUrl(value), "请输入有效 URL 或站内绝对路径")
  .optional();

const gameFormSchema = z.object({
  title: z.string().trim().min(1, "请输入游戏名称").max(100, "游戏名称不能超过 100 个字符"),
  slug: z
    .string()
    .trim()
    .min(1, "请输入 URL Slug")
    .max(60, "URL Slug 不能超过 60 个字符")
    .regex(/^[a-z0-9\u4e00-\u9fa5]+(?:-[a-z0-9\u4e00-\u9fa5]+)*$/, "仅支持小写字母、数字、中文和连字符"),
  tagline: z.string().trim().max(160, "简介不能超过 160 个字符").optional(),
  description: z.string().trim().min(1, "请输入游戏说明").max(5000, "游戏说明不能超过 5000 个字符"),
  sceneType: z.enum(SCENE_TYPES),
  sceneConfig: z.string().trim(),
  htmlUrl: z.string(),
  coverImage: optionalUrl,
  coverGradient: z.string().trim().max(500, "渐变样式不能超过 500 个字符").optional(),
  tags: z.string().trim().max(300, "标签内容不能超过 300 个字符").optional(),
  controlsHint: z.string().trim().max(500, "操作提示不能超过 500 个字符").optional(),
  authorName: z.string().trim().min(1, "请输入作者名称").max(80, "作者名称不能超过 80 个字符"),
  authorLink: optionalUrl,
  status: z.enum(["draft", "published"]),
}).superRefine((values, ctx) => {
  if (values.sceneType !== "html-game" && !sceneConfigIsValid(values.sceneConfig)) {
    ctx.addIssue({ code: "custom", path: ["sceneConfig"], message: "请输入有效的 JSON 对象" });
  }
  if (values.sceneType === "html-game" && !isUploadedGameHtmlUrl(values.htmlUrl)) {
    ctx.addIssue({ code: "custom", path: ["htmlUrl"], message: "请先上传 HTML 游戏文件" });
  }
});

export type GameFormValues = z.infer<typeof gameFormSchema>;

interface GameFormProps {
  open: boolean;
  onSubmit: (data: GameFormValues) => void | Promise<void>;
  isLoading?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
}

const defaultValues: GameFormValues = {
  title: "",
  slug: "",
  tagline: "",
  description: "",
  sceneType: "html-game",
  sceneConfig: "",
  htmlUrl: "",
  coverImage: "",
  coverGradient: "",
  tags: "",
  controlsHint: "",
  authorName: "李伟",
  authorLink: "",
  status: "draft",
};

const sceneLabels: Record<(typeof SCENE_TYPES)[number], string> = {
  "html-game": "HTML 游戏",
  "crystal-cluster": "晶体簇",
  "wave-field": "波场",
  "torus-knot": "环面纽结",
  "orbiting-spheres": "轨道球",
  "abyssal-well": "原生 WebGL2",
};

export function GameForm({ open, onSubmit, isLoading = false, onUploadingChange }: GameFormProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedName, setUploadedName] = useState("");
  const [failedCover, setFailedCover] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const uploadController = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const form = useForm<GameFormValues>({
    resolver: zodResolver(gameFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) form.reset(defaultValues);
  }, [form, open]);

  useEffect(() => () => uploadController.current?.abort(), []);

  const sceneType = form.watch("sceneType");
  const htmlUrl = form.watch("htmlUrl");
  const coverImage = form.watch("coverImage")?.trim() || "";

  const uploadHtml = async (file: File) => {
    const error = validateGameHtmlFile(file);
    if (error) {
      setUploadError(error);
      return;
    }
    const controller = new AbortController();
    uploadController.current = controller;
    setUploading(true);
    onUploadingChange?.(true);
    setUploadError("");
    try {
      const response = await fetch(`/api/admin/games/upload?filename=${encodeURIComponent(file.name)}`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: file,
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || !isUploadedGameHtmlUrl(result.data?.url)) {
        throw new Error(result?.error || (response.status === 413 ? "HTML 文件不能超过 4 MB" : "HTML 上传失败，请重试"));
      }
      form.setValue("htmlUrl", result.data.url, { shouldDirty: true, shouldValidate: true });
      setUploadedName(file.name);
    } catch (error) {
      if (!controller.signal.aborted) setUploadError(error instanceof Error ? error.message : "HTML 上传失败，请重试");
    } finally {
      if (!controller.signal.aborted) {
        setUploading(false);
        onUploadingChange?.(false);
      }
    }
  };

  const generateSlug = () => {
    const generated = form
      .getValues("title")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/g, "");

    form.setValue("slug", generated, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => {
        if (!uploading && !isLoading) return onSubmit(values);
      })} className="space-y-5">
        <fieldset disabled={isLoading || uploading} className="min-w-0 space-y-5 disabled:opacity-70">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>游戏名称 *</FormLabel>
                <FormControl>
                  <Input placeholder="例如：星光棱镜" autoFocus {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL Slug *</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input placeholder="starlight-prism" {...field} />
                  </FormControl>
                  <Button type="button" variant="outline" onClick={generateSlug}>
                    生成
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tagline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>一句话简介</FormLabel>
              <FormControl>
                <Input placeholder="用一句话说明这个互动场景的看点" {...field} />
              </FormControl>
              <FormDescription>显示在游戏列表卡片中。</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>游戏说明 *</FormLabel>
              <FormControl>
                <Textarea rows={5} className="resize-y" placeholder="说明玩法、视觉效果或创作背景。支持换行。" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="sceneType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>场景类型 *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择场景类型" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SCENE_TYPES.map((sceneType) => (
                      <SelectItem key={sceneType} value={sceneType}>
                        {sceneLabels[sceneType]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>发布状态</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">保存为草稿</SelectItem>
                    <SelectItem value="published">立即发布</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {sceneType === "html-game" && (
          <FormField
            control={form.control}
            name="htmlUrl"
            render={() => (
              <FormItem>
                <FormLabel>HTML 游戏文件 *</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    ref={fileInput}
                    className="hidden"
                    accept=".html,.htm,text/html"
                    aria-label="上传 HTML 游戏文件"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) void uploadHtml(file);
                    }}
                  />
                </FormControl>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" variant="outline" onClick={() => fileInput.current?.click()}>
                    <Upload className="mr-2 size-4" />{htmlUrl ? "替换 HTML 文件" : "上传 HTML 文件"}
                  </Button>
                  <span className="text-xs text-muted-foreground">HTML / HTM · UTF-8 · 最大 4 MB</span>
                </div>
                {uploading ? (
                  <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />正在上传...</p>
                ) : htmlUrl ? (
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <FileCode2 className="size-4 shrink-0 text-green-600" />
                    <span className="min-w-0 flex-1 break-all">{uploadedName || "HTML 文件"} · 已上传</span>
                    <Button type="button" variant="outline" size="sm" aria-expanded={previewOpen} onClick={() => setPreviewOpen((value) => !value)}><Play className="mr-1 size-4" />{previewOpen ? "关闭预览" : "预览游戏"}</Button>
                    <Button type="button" variant="ghost" size="icon" title="移除文件" aria-label="移除文件" onClick={() => {
                      form.setValue("htmlUrl", "", { shouldDirty: true, shouldValidate: true });
                      setUploadedName("");
                      setUploadError("");
                      setPreviewOpen(false);
                    }}><X className="size-4" /></Button>
                  </div>
                ) : null}
                {uploadError && <p role="alert" className="text-sm text-destructive">{uploadError}</p>}
                <FormMessage />
                {previewOpen && htmlUrl && <HtmlGame key={htmlUrl} url={htmlUrl} title="HTML 游戏预览" preview />}
              </FormItem>
            )}
          />
        )}

        {sceneType !== "html-game" && <FormField
          control={form.control}
          name="sceneConfig"
          render={({ field }) => (
            <FormItem>
              <FormLabel>场景参数（JSON）</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  className="resize-y font-mono text-xs"
                  placeholder={'{\n  "primary": "#8fb4e8",\n  "metalness": 0.45\n}'}
                  {...field}
                />
              </FormControl>
              <FormDescription>留空则使用场景默认值；仅接受 JSON 对象。</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="coverImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>封面图 URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/cover.jpg 或 /assets/cover.jpg" {...field} />
                </FormControl>
                <FormMessage />
                {coverImage && isSafeGameUrl(coverImage) && (
                  <div className="aspect-video overflow-hidden rounded-md border bg-muted">
                    {failedCover === coverImage ? (
                      <p role="status" className="flex h-full items-center justify-center px-3 text-sm text-muted-foreground">封面加载失败，请检查 URL</p>
                    ) : (
                      // Arbitrary administrator-provided image hosts cannot use the Next image allowlist.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={coverImage} src={coverImage} alt="游戏封面预览" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={() => setFailedCover(coverImage)} />
                    )}
                  </div>
                )}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="coverGradient"
            render={({ field }) => (
              <FormItem>
                <FormLabel>备用封面渐变</FormLabel>
                <FormControl>
                  <Input placeholder="linear-gradient(140deg, #22303d, #b9cede)" {...field} />
                </FormControl>
                <FormDescription>未设置封面图时使用。</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>标签</FormLabel>
                <FormControl>
                  <Input placeholder="WebGL, Three.js, 交互设计" {...field} />
                </FormControl>
                <FormDescription>多个标签请用逗号分隔。</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="controlsHint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>操作提示</FormLabel>
                <FormControl>
                  <Input placeholder="拖拽旋转视角，滚轮缩放，双击复位" {...field} />
                </FormControl>
                <FormDescription>多个提示请用逗号分隔。</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="authorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>作者名称 *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="authorLink"
            render={({ field }) => (
              <FormItem>
                <FormLabel>作者链接</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        </fieldset>

        <div className="flex justify-end pt-1">
          <Button type="submit" disabled={isLoading || uploading}>
            {(isLoading || uploading) && <Loader2 className="mr-2 size-4 animate-spin" />}
            {uploading ? "上传中..." : isLoading ? "创建中..." : "创建游戏"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
