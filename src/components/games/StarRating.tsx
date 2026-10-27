"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  /** 展示值：交互模式为已打分数（0=未打），只读模式为均分（可为小数） */
  value: number;
  interactive?: boolean;
  size?: number;
  /** 交互模式：点击第 n 颗星时触发 */
  onRate?: (score: number) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * 五星评分：
 * - 交互模式：hover 高亮 + 点击打分（整数 1-5）
 * - 只读模式：按百分比裁剪实现半星/部分星填充
 */
export default function StarRating({
  value,
  interactive = false,
  size = 18,
  onRate,
  disabled = false,
  className = "",
}: StarRatingProps) {
  const [hoverScore, setHoverScore] = useState(0);
  const clamped = Math.max(0, Math.min(5, value));

  if (!interactive) {
    const percent = (clamped / 5) * 100;
    return (
      <span className={`relative inline-flex shrink-0 ${className}`} aria-label={`平均评分 ${clamped.toFixed(1)} / 5`}>
        <span className="flex gap-0.5 text-ink/25">
          {Array.from({ length: 5 }, (_, index) => (
            <Star key={index} style={{ width: size, height: size }} aria-hidden="true" />
          ))}
        </span>
        <span className="absolute inset-0 flex gap-0.5 overflow-hidden text-accent" style={{ width: `${percent}%` }}>
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              style={{ width: size, height: size, minWidth: size }}
              fill="currentColor"
              aria-hidden="true"
            />
          ))}
        </span>
      </span>
    );
  }

  const activeScore = hoverScore || clamped;

  return (
    <span
      className={`inline-flex gap-0.5 ${className}`}
      role="radiogroup"
      aria-label="五星打分"
      onMouseLeave={() => setHoverScore(0)}
    >
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type="button"
          role="radio"
          aria-checked={clamped === score}
          aria-label={`${score} 星`}
          disabled={disabled}
          onMouseEnter={() => setHoverScore(score)}
          onFocus={() => setHoverScore(score)}
          onClick={() => onRate?.(score)}
          className="rounded-sm p-0.5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Star
            style={{ width: size, height: size }}
            className={score <= activeScore ? "text-accent" : "text-ink/25"}
            fill={score <= activeScore ? "currentColor" : "none"}
            aria-hidden="true"
          />
        </button>
      ))}
    </span>
  );
}
