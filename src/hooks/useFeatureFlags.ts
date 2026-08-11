"use client";

import { useEffect, useState } from "react";

export type FeatureFlags = {
  showSponsorPage: boolean;
  showWeatherWidget: boolean;
  showSnakeGame: boolean;
  showGeoLab: boolean;
  showAuthorPage: boolean;
  enable3DTools: boolean;
};

const DEFAULT_FLAGS: FeatureFlags = {
  showSponsorPage: false,
  showWeatherWidget: false,
  showSnakeGame: false,
  showGeoLab: false,
  showAuthorPage: false,
  enable3DTools: false,
};

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/features")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setFlags({ ...DEFAULT_FLAGS, ...data.data });
        }
      })
      .catch(() => {
        // Use defaults on error
      })
      .finally(() => setLoading(false));
  }, []);

  return { flags, loading };
}
