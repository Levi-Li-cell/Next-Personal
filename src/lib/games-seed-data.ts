import type { SceneConfig, SceneType } from "@/lib/games-types";

/**
 * 互动作品种子数据：interactive_work 表为空时自动灌入（与 knowledge 模块同策略）。
 * ratingDistribution 用于生成对应数量的 interactive_rating 明细，保证评分图表与均分一致。
 */
export interface GameSeedItem {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  authorName: string;
  authorLink: string | null;
  tags: string[];
  coverGradient: string;
  sceneType: SceneType;
  sceneConfig: SceneConfig;
  controlsHint: string[];
  viewCount: number;
  likeCount: number;
  /** 评分分布 [1星数, 2星数, 3星数, 4星数, 5星数] */
  ratingDistribution: [number, number, number, number, number];
  comments: Array<{ guestName: string; content: string; likeCount: number; replies?: Array<{ guestName: string; content: string; likeCount: number }> }>;
}

export const DEFAULT_GAME_SEEDS: GameSeedItem[] = [
  {
    slug: "starlight-prism",
    title: "星光棱镜",
    tagline: "漂浮在雾气中的晶体群，随视角流转折射出不同光泽",
    description:
      "星光棱镜是一个以晶体簇为主体的 WebGL 交互场景。数十枚八面体与二十面体悬浮在柔雾中，每枚晶体保持独立的自转速度，金属度与粗糙度经过逐枚微调，让高光在转动时呈现细碎的闪烁。\n\n切换到 Normal 模式可以观察几何表面的法线朝向，颜色代表法线在切线空间的分布；Depth 模式则把近处的晶体染成亮色、远处的压暗，适合检查场景的纵深关系。\n\n场景采用三灯布光：一盏主平行光负责体积感，一盏冷色补光勾勒轮廓，一盏点光源在中心缓慢游走，制造动态的高光扫过效果。",
    authorName: "李伟",
    authorLink: null,
    tags: ["WebGL", "Three.js", "晶体"],
    coverGradient: "linear-gradient(140deg, #2b3a55 0%, #4f6899 55%, #a8c0e6 100%)",
    sceneType: "crystal-cluster",
    sceneConfig: {
      background: "#111827",
      fogColor: "#1c2536",
      fogNear: 8,
      fogFar: 26,
      primary: "#8fb4e8",
      secondary: "#e8c58f",
      accent: "#f4e5cf",
      metalness: 0.45,
      roughness: 0.22,
      ambientIntensity: 0.5,
      clusterCount: 42,
      clusterRadius: 5.2,
    },
    controlsHint: ["拖拽旋转视角", "滚轮缩放", "双击复位", "右上角切换渲染模式"],
    viewCount: 1286,
    likeCount: 96,
    ratingDistribution: [0, 1, 3, 9, 14],
    comments: [
      {
        guestName: "访客_Aria",
        content: "Normal 模式下的法线配色太好看了，切到线框像换了一个作品。",
        likeCount: 12,
        replies: [
          { guestName: "李伟", content: "法线材质其实是调试时最顺手的副产品，干脆留成了正式模式。", likeCount: 6 },
        ],
      },
      { guestName: "川流", content: "在集显笔记本上也能稳定 60 帧，性能控制得不错。", likeCount: 5 },
    ],
  },
  {
    slug: "tide-grid",
    title: "潮汐网格",
    tagline: "两列正弦波在网格上相互干涉，像一片被参数化的海面",
    description:
      "潮汐网格用一块 80×80 分段的平面承载顶点动画：两组不同频率、不同相位的正弦波沿 X/Y 方向传播并叠加，每帧重算顶点高度与法线，得到一片持续呼吸的参数化海面。\n\n材质使用低金属度 + 中粗糙度的哑光配置，让波峰的受光面与背光面形成柔和的明暗带；雾效把远端网格溶进背景，只保留中景的信息量。\n\n建议先在 Albedo 模式下感受波动节奏，再切到线框模式观察波峰的相位错位 —— 那是整个场景最好看的瞬间。",
    authorName: "李伟",
    authorLink: null,
    tags: ["WebGL", "顶点动画", "参数化"],
    coverGradient: "linear-gradient(140deg, #16323f 0%, #2f6e6a 55%, #9fd4c0 100%)",
    sceneType: "wave-field",
    sceneConfig: {
      background: "#0f2229",
      fogColor: "#123037",
      fogNear: 10,
      fogFar: 30,
      primary: "#4fa08c",
      secondary: "#d8e8dd",
      accent: "#e9bd7d",
      metalness: 0.15,
      roughness: 0.55,
      ambientIntensity: 0.6,
      amplitude: 0.55,
      frequency: 0.9,
      speed: 0.9,
      segments: 80,
    },
    controlsHint: ["拖拽旋转视角", "滚轮缩放", "双击复位", "左上角查看实时 FPS"],
    viewCount: 942,
    likeCount: 71,
    ratingDistribution: [0, 0, 4, 8, 9],
    comments: [
      { guestName: "海边的卡夫卡", content: "波峰扫过去的瞬间有被治愈到，适合当桌面。", likeCount: 8 },
    ],
  },
  {
    slug: "torus-drift",
    title: "环面漫游",
    tagline: "一枚缓慢自旋的三叶环面结，金属拉丝质感随光源游走",
    description:
      "环面漫游的主体是一枚 220×32 分段的三叶环面结（TorusKnot）。几何本身不变，看点全部交给材质与光：金属度 0.62 让表面像拉丝铝材，主光源沿圆轨道缓慢公转，高光带随之在曲面上游走。\n\n法线模式在这里的教育意义最强 —— 你能直观看到扭结曲面法线的连续翻转；深度模式则把扭结的“近粗远细”夸张化，用于确认相机距离是否合理。\n\n建议滚轮推近到高光充满画面的位置停住，等光源转到正对面。",
    authorName: "李伟",
    authorLink: null,
    tags: ["WebGL", "PBR", "几何体"],
    coverGradient: "linear-gradient(140deg, #3a2b3f 0%, #7a4b62 55%, #e3a8a0 100%)",
    sceneType: "torus-knot",
    sceneConfig: {
      background: "#191320",
      fogColor: "#241a2a",
      fogNear: 6,
      fogFar: 22,
      primary: "#c98ba4",
      secondary: "#f4e5cf",
      accent: "#e9bd7d",
      metalness: 0.62,
      roughness: 0.28,
      ambientIntensity: 0.45,
      lightOrbitSpeed: 0.35,
    },
    controlsHint: ["拖拽旋转视角", "滚轮缩放", "双击复位", "右上角切换渲染模式"],
    viewCount: 767,
    likeCount: 58,
    ratingDistribution: [1, 1, 2, 7, 8],
    comments: [
      {
        guestName: "Momo",
        content: "金属质感拉满，请问是标准材质还是自己写的 shader？",
        likeCount: 4,
        replies: [
          { guestName: "李伟", content: "MeshStandardMaterial + 移动点光源，没有自定义 shader，靠布光撑质感。", likeCount: 9 },
        ],
      },
    ],
  },
  {
    slug: "gravity-corridor",
    title: "引力回廊",
    tagline: "三层轨道上的小球绕核心公转，轨道倾角构成一个动态星环",
    description:
      "引力回廊模拟一个微型星系：中央高金属度核心球 + 三层不同倾角、不同转速的轨道环，每层轨道分布 4-6 颗大小不一的卫星球。轨道线用低透明度的细环面呈现，既是视觉参考也是构图元素。\n\n三个轨道层的公转周期按 1 : 1.6 : 2.4 的近似共振比例设定，每隔一段时间会出现一次三星连线的对齐瞬间 —— 拖拽视角到俯视位等待即可。\n\n切换渲染模式时轨道线保持不变，只有实体球参与切换，方便区分参与计算的主体与辅助线框。",
    authorName: "李伟",
    authorLink: null,
    tags: ["WebGL", "轨道力学", "程序动画"],
    coverGradient: "linear-gradient(140deg, #22303d 0%, #46617a 55%, #b9cede 100%)",
    sceneType: "orbiting-spheres",
    sceneConfig: {
      background: "#0d1620",
      fogColor: "#14222e",
      fogNear: 10,
      fogFar: 32,
      primary: "#7fa3c4",
      secondary: "#e8c58f",
      accent: "#f4e5cf",
      metalness: 0.5,
      roughness: 0.35,
      ambientIntensity: 0.55,
      coreRadius: 1.1,
      orbitCount: 3,
    },
    controlsHint: ["拖拽旋转视角", "滚轮缩放", "双击复位", "俯视位可等待三星连线"],
    viewCount: 1103,
    likeCount: 84,
    ratingDistribution: [0, 2, 4, 10, 11],
    comments: [
      { guestName: "轨道爱好者", content: "等到了三星连线！那个瞬间值得截图。", likeCount: 15 },
      { guestName: "Nova", content: "轨道线用低透明度处理很聪明，不抢主体的戏。", likeCount: 3 },
    ],
  },
  {
    slug: "amber-lattice",
    title: "琥珀晶格",
    tagline: "暖色晶体簇在暗室中缓慢生长，琥珀色高光是唯一的光源线索",
    description:
      "琥珀晶格是星光棱镜的姊妹篇：同一套晶体簇生成逻辑，但配色全部换成暖色系，并把点光源收纳进晶体群内部 —— 光从几何体之间透出来，在雾里形成柔和的辉光。\n\n金属度下调到 0.3、粗糙度上调到 0.35，让晶体更像树脂而非金属，高光更钝、更暖。\n\n深度模式在这个场景里几乎变成一张版画：近处晶体是浅琥珀，远处沉入深棕，纵深一层层退开。",
    authorName: "李伟",
    authorLink: null,
    tags: ["WebGL", "Three.js", "氛围光"],
    coverGradient: "linear-gradient(140deg, #33241a 0%, #7a5230 55%, #e0b478 100%)",
    sceneType: "crystal-cluster",
    sceneConfig: {
      background: "#171009",
      fogColor: "#221609",
      fogNear: 7,
      fogFar: 24,
      primary: "#d9a45b",
      secondary: "#8a5a2e",
      accent: "#f4e5cf",
      metalness: 0.3,
      roughness: 0.35,
      ambientIntensity: 0.4,
      clusterCount: 36,
      clusterRadius: 4.8,
    },
    controlsHint: ["拖拽旋转视角", "滚轮缩放", "双击复位", "左上角查看实时 FPS"],
    viewCount: 658,
    likeCount: 42,
    ratingDistribution: [0, 1, 2, 6, 7],
    comments: [],
  },
  {
    slug: "mist-terrain",
    title: "雾海地形",
    tagline: "低频噪声驱动的起伏地形，雾效吞掉地平线只剩中景",
    description:
      "雾海地形把潮汐网格的波源从两组正弦换成多倍频叠加：低频决定山脊走向，中频填充丘陵，高频只贡献细微褶皱，最终得到一片一眼看不出周期的地形。\n\n雾的近远距离被刻意压缩（10 到 26），任何视角下地平线都不可见，画面只剩下脚下的丘陵与远处的轮廓，形成“雾海”的观感。\n\n线框模式适合观察多倍频噪声的叠加痕迹：密网格的疏密变化就是各倍频的能量分布。",
    authorName: "李伟",
    authorLink: null,
    tags: ["WebGL", "程序化地形", "噪声"],
    coverGradient: "linear-gradient(140deg, #1f2a33 0%, #4c5f6e 55%, #aebfc6 100%)",
    sceneType: "wave-field",
    sceneConfig: {
      background: "#131a20",
      fogColor: "#1a242c",
      fogNear: 10,
      fogFar: 26,
      primary: "#6e8291",
      secondary: "#c9d6db",
      accent: "#e9bd7d",
      metalness: 0.1,
      roughness: 0.62,
      ambientIntensity: 0.65,
      amplitude: 1.1,
      frequency: 0.45,
      speed: 0.35,
      segments: 90,
    },
    controlsHint: ["拖拽旋转视角", "滚轮缩放", "双击复位", "线框模式观察噪声倍频"],
    viewCount: 531,
    likeCount: 37,
    ratingDistribution: [1, 0, 3, 5, 6],
    comments: [
      { guestName: "远山", content: "雾的距离压得很好，完全看不到地平线，沉浸感很强。", likeCount: 7 },
    ],
  },
];
