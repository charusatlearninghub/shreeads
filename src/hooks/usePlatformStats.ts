import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformStats {
  activeStudents: number;
  videoLessons: number;
  expertCourses: number;
}

export const formatStat = (value: number): string => {
  return value.toLocaleString();
};

export const usePlatformStats = () => {
  return useQuery({
    queryKey: ["platform-stats"],
    queryFn: async (): Promise<PlatformStats> => {
      const { data, error } = await supabase.rpc("get_public_platform_stats");
      if (error) {
        console.error("Statistics fetch failed:", error);
        throw error;
      }

      if (!data) {
        const missingStatsError = new Error("Platform statistics were unavailable");
        console.error("Statistics fetch failed:", missingStatsError);
        throw missingStatsError;
      }

      const raw = data as {
        active_students?: unknown;
        video_lessons?: unknown;
        expert_courses?: unknown;
      };
      const next = {
        activeStudents: Number(raw.active_students),
        videoLessons: Number(raw.video_lessons),
        expertCourses: Number(raw.expert_courses),
      };

      if (Object.values(next).some((value) => !Number.isFinite(value) || value < 0)) {
        const invalidStatsError = new Error("Platform statistics had an invalid response");
        console.error("Statistics fetch failed:", invalidStatsError);
        throw invalidStatsError;
      }

      return next;
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
};
