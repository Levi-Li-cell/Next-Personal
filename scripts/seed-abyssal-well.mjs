/**
 * 深渊之井（ABYSSAL WELL）· 互动作品种子脚本
 *
 * 用法：node scripts/seed-abyssal-well.mjs
 * 幂等：按 slug upsert（统计字段不被覆盖），可重复执行。
 * 与 sync-games-tables.mjs 同一套连接约定（DIRECT_URL 优先）。
 */
import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL, {
  prepare: false,
});

const ROW = {
  id: "abyssal-well-awp1-engine",
  slug: "abyssal-well",
  title: "深渊之井",
  tagline: "原生 WebGL2 像素洞穴光影沙盒 · MRT 延迟渲染 · Ping-Pong GPU 流体",
  description: [
    "一款完全自包含的单文件原生 WebGL2 引擎作品：GLSL ES 3.00 七程序管线，G-Buffer 三附件 MRT（Albedo / Normal+深度 / Emissive+高光），",
    "岩石、植物、角色的颜色与法线贴图全部由同一高度场程序化生成（Sobel 梯度），洞穴烟雾由低分辨率 Ping-Pong FBO 半拉格朗日平流驱动。",
    "宿主页面通过 AWP/1 postMessage 协议实时驱动引擎：切换 G-Buffer 调试通道、拖动 uniform 滑杆、以任意种子重建世界、帧内同步快照。",
    "种子即世界地址——同一个 seed 永远生成同一座洞穴，可以分享。",
  ].join(""),
  tags: ["WebGL2", "延迟渲染", "程序化生成", "像素艺术", "GPU 流体", "postMessage 协议"],
  coverImage: "/liwei/images/abyssal-well-cover.png",
  coverGradient: "linear-gradient(135deg, #04141a 0%, #0a3a36 55%, #123a52 100%)",
  sceneType: "abyssal-well",
  sceneConfig: {},
  controlsHint: ["A / D 移动", "W / Space 跳跃", "S 下蹲 / 下落", "鼠标 探照灯", "1–8 渲染通道", "R 重置位置"],
};

const inserted = await sql`
  INSERT INTO interactive_work (id, slug, title, tagline, description, tags, cover_image, cover_gradient, scene_type, scene_config, controls_hint, status)
  VALUES (${ROW.id}, ${ROW.slug}, ${ROW.title}, ${ROW.tagline}, ${ROW.description},
          ${JSON.stringify(ROW.tags)}::jsonb, ${ROW.coverImage}, ${ROW.coverGradient}, ${ROW.sceneType},
          ${JSON.stringify(ROW.sceneConfig)}::jsonb, ${JSON.stringify(ROW.controlsHint)}::jsonb, 'published')
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    tagline = EXCLUDED.tagline,
    description = EXCLUDED.description,
    tags = EXCLUDED.tags,
    cover_image = EXCLUDED.cover_image,
    cover_gradient = EXCLUDED.cover_gradient,
    scene_type = EXCLUDED.scene_type,
    scene_config = EXCLUDED.scene_config,
    controls_hint = EXCLUDED.controls_hint,
    updated_at = now()
  RETURNING id, slug, title, scene_type, status
`;

console.log("upserted:", JSON.stringify(inserted[0]));
await sql.end();
