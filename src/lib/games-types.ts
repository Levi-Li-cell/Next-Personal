/**
 * 互动小游戏模块 · 核心数据模型（前台/后台/客户端共享）
 *
 * 对应四张数据表：
 * - interactive_work        → WorkDetail
 * - interactive_rating      → InteractionStats.rating
 * - interactive_comment     → CommentSystem
 * - interactive_comment_like→ CommentNode.likedByMe / likeCount
 */

/** 渲染模式：基础色 / 法线 / 线框 / 深度 */
export type RenderMode = "albedo" | "normal" | "wireframe" | "depth";

/** WebGL 场景类型（决定画布内容，随作品数据下发） */
export type SceneType =
  | "crystal-cluster"
  | "wave-field"
  | "torus-knot"
  | "orbiting-spheres";

/** 场景配色与参数（宽松结构，由各场景自行消费） */
export interface SceneConfig {
  background?: string;
  fogColor?: string;
  fogNear?: number;
  fogFar?: number;
  primary?: string;
  secondary?: string;
  accent?: string;
  metalness?: number;
  roughness?: number;
  ambientIntensity?: number;
  /** 各场景自定义参数，如振幅、转速、数量 */
  [key: string]: unknown;
}

/** 作品作者（当前为站长的展示位，预留多人扩展） */
export interface WorkAuthor {
  name: string;
  link?: string | null;
}

/** 作品完整信息（详情页主数据，列表页取其子集 WorkSummary） */
export interface WorkDetail {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string;
  author: WorkAuthor;
  tags: string[];
  coverImage: string | null;
  coverGradient: string | null;
  sceneType: SceneType;
  sceneConfig: SceneConfig;
  controlsHint: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

/** 列表页卡片数据（WorkDetail 摘要 + 反范式统计） */
export interface WorkSummary extends Pick<
  WorkDetail,
  "id" | "slug" | "title" | "tagline" | "tags" | "coverImage" | "coverGradient" | "sceneType"
> {
  viewCount: number;
  downloadCount: number;
  commentCount: number;
  ratingAverage: number;
  ratingCount: number;
  createdAt: string;
}

/** 画布性能与渲染状态（纯客户端瞬时数据，不入库） */
export interface RuntimeMetrics {
  /** 每秒帧数（EMA 平滑值） */
  fps: number;
  /** 单帧耗时（毫秒） */
  frameTimeMs: number;
  /** 当前渲染模式 */
  renderMode: RenderMode;
  /** 画布是否就绪（场景构建完成） */
  ready: boolean;
  /** 是否处于交互中（按住拖拽） */
  interacting: boolean;
}

/** 1-5 星评分分布 */
export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

/** 评分聚合 */
export interface RatingSummary {
  average: number;
  total: number;
  distribution: RatingDistribution;
  /** 当前访客（登录用户或游客 voterKey）已打的分数，null 表示未打分 */
  myScore: number | null;
}

/** 统计数据与评分（侧边栏数据统计卡片 + 评分卡片共享） */
export interface InteractionStats {
  viewCount: number;
  downloadCount: number;
  commentCount: number;
  rating: RatingSummary;
}

/** 评论节点：平铺存储（parent_id 自关联），读取时组装为单层树 */
export interface CommentNode {
  id: string;
  workId: string;
  content: string;
  userId: string | null;
  displayName: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  replies: CommentNode[];
}

/** 评论区数据（输入框 + 列表 + 树结构） */
export interface CommentSystem {
  workId: string;
  total: number;
  list: CommentNode[];
}

/** 通用 API 响应包装（与全站接口约定一致） */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
