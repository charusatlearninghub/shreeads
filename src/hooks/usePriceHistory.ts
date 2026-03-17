import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PriceHistoryEntry {
  id: string;
  course_id: string;
  old_price: number | null;
  new_price: number | null;
  old_discount_price: number | null;
  new_discount_price: number | null;
  old_is_free: boolean | null;
  new_is_free: boolean | null;
  changed_at: string;
  changed_by: string | null;
}

export const usePriceHistory = (courseId?: string) => {
  return useQuery({
    queryKey: ['price-history', courseId],
    queryFn: async () => {
      let query = supabase
        .from('price_history')
        .select('*')
        .order('changed_at', { ascending: false });
      
      if (courseId) {
        query = query.eq('course_id', courseId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as PriceHistoryEntry[];
    },
  });
};
