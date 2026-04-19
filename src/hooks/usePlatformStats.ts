import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformStats {
  activeStudents: number;
  videoLessons: number;
  expertCourses: number;
}

const CACHE_KEY = "platform_stats_cache_v1";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedStats {
  data: PlatformStats;
  timestamp: number;
}

const readCache = (): PlatformStats | null => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedStats = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
};

const writeCache = (data: PlatformStats) => {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, timestamp: Date.now() } satisfies CachedStats)
    );
  } catch {
    // ignore quota errors
  }
};

export const formatStat = (value: number): string => {
  if (value >= 1000) return `${value.toLocaleString()}+`;
  if (value === 0) return "0";
  return `${value}+`;
};

export const usePlatformStats = () => {
  const cached = readCache();
  const [stats, setStats] = useState<PlatformStats>(
    cached ?? { activeStudents: 0, videoLessons: 0, expertCourses: 0 }
  );
  const [isLoading, setIsLoading] = useState(!cached);

  useEffect(() => {
    if (cached) return; // serve cached value, skip fetch

    let cancelled = false;
    const fetchStats = async () => {
      try {
        const [enrollmentsRes, lessonsRes, coursesRes] = await Promise.all([
          supabase.from("enrollments").select("user_id"),
          supabase.from("lessons").select("id", { count: "exact", head: true }),
          supabase
            .from("courses")
            .select("id", { count: "exact", head: true })
            .eq("is_published", true),
        ]);

        const uniqueStudents = new Set(
          (enrollmentsRes.data || []).map((e) => e.user_id)
        ).size;

        const next: PlatformStats = {
          activeStudents: uniqueStudents,
          videoLessons: lessonsRes.count || 0,
          expertCourses: coursesRes.count || 0,
        };

        if (!cancelled) {
          setStats(next);
          writeCache(next);
        }
      } catch (err) {
        console.error("Error fetching platform stats:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchStats();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { stats, isLoading };
};
