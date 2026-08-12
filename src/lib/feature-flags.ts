import { sql } from "drizzle-orm";
import { db } from "@/db";

export const DEFAULT_FEATURE_FLAGS: Record<string, boolean> = {
  showSponsorPage: false,
  showWeatherWidget: false,
  showSnakeGame: false,
  showGeoLab: false,
  showAuthorPage: false,
  allowPublicAuthorPage: false,
  enable3DTools: false,
};

export async function getFeatureFlags(): Promise<Record<string, boolean>> {
  try {
    const result = await db.execute(sql`
      SELECT value FROM site_setting WHERE key = 'feature_flags'
    `) as { value: string }[];
    if (!result.length) return { ...DEFAULT_FEATURE_FLAGS };

    const parsed = JSON.parse(result[0].value);
    return { ...DEFAULT_FEATURE_FLAGS, ...parsed };
  } catch (error) {
    console.error("Failed to read feature flags:", error);
    return { ...DEFAULT_FEATURE_FLAGS };
  }
}
