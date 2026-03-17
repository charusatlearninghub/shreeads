import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActivePromotionWithCourses {
  id: string;
  name: string;
  description: string | null;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  course_count: number;
}

export const useActivePromotions = () => {
  return useQuery({
    queryKey: ['active-promotions'],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      // Get active promotions
      const { data: promotions, error: promotionsError } = await supabase
        .from('promotions')
        .select('id, name, description, discount_percentage, start_date, end_date')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('discount_percentage', { ascending: false });
      
      if (promotionsError) throw promotionsError;
      if (!promotions || promotions.length === 0) return [];
      
      // Get course counts for each promotion
      const promotionIds = promotions.map(p => p.id);
      const { data: courseCounts, error: countsError } = await supabase
        .from('promotion_courses')
        .select('promotion_id')
        .in('promotion_id', promotionIds);
      
      if (countsError) throw countsError;
      
      // Count courses per promotion
      const countMap = (courseCounts || []).reduce((acc, pc) => {
        acc[pc.promotion_id] = (acc[pc.promotion_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return promotions.map(p => ({
        ...p,
        course_count: countMap[p.id] || 0,
      })) as ActivePromotionWithCourses[];
    },
    refetchInterval: 60000, // Refetch every minute
  });
};
