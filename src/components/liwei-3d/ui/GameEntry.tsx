'use client'

import Link from 'next/link'

/**
 * 首页「互动小游戏」快捷入口 —— iOS 风格按钮（Apple HIG）：
 * 固定停靠在右下角（与左下角 AI 助手镜像对称）。
 * - 蓝色渐变填充（#007AFF → #0062CC）、12px 圆角、顶部内高光、
 *   1px 半透明白边框、柔和蓝色投影、毛玻璃背景
 * - 白色 semibold 标签 + 手柄图标（CSS 滤镜转白）
 * - 点击跳转游戏列表页 /games；悬浮时图标微弹、按钮上浮，
 *   并滑入提示气泡「跳转游戏页」
 */
export default function GameEntry() {
  return (
    <Link
      href="/games"
      className="home-game-entry"
      aria-label="进入互动小游戏，跳转游戏页"
    >
      <span className="home-game-entry-icon">
        <img src="/game.svg" alt="" width={20} height={20} />
      </span>
      <span className="home-game-entry-label">进入小游戏</span>
      <span className="home-game-entry-tip" role="tooltip">
        跳转游戏页
      </span>
    </Link>
  )
}
