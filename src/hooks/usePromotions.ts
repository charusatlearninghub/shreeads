import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface PromotionCourse {
  id: string;
  promotion_id: string;
  course_id: string;
  created_at: string;
}

export interface PromotionSoftware {
  id: string;
  promotion_id: string;
  product_id: string;
  created_at: string;
}

export interface ActivePromotion {
  promotion_id: string;
  promotion_name: string;
  discount_percentage: number;
  end_date: string;
}

export const usePromotions = () => {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Promotion[];
    },
  });
};

export const usePromotionCourses = (promotionId: string | null) => {
  return useQuery({
    queryKey: ['promotion-courses', promotionId],
    queryFn: async () => {
      if (!promotionId) return [];
      
      const { data, error } = await supabase
        .from('promotion_courses')
        .select('*')
        .eq('promotion_id', promotionId);
      
      if (error) throw error;
      return data as PromotionCourse[];
    },
    enabled: !!promotionId,
  });
};

export const usePromotionSoftware = (promotionId: string | null) => {
  return useQuery({
    queryKey: ['promotion-software', promotionId],
    queryFn: async () => {
      if (!promotionId) return [];
      
      const { data, error } = await supabase
        .from('promotion_software')
        .select('*')
        .eq('promotion_id', promotionId);
      
      if (error) throw error;
      return data as PromotionSoftware[];
    },
    enabled: !!promotionId,
  });
};

export const useActivePromotionForCourse = (courseId: string) => {
  return useQuery({
    queryKey: ['active-promotion', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_active_promotion_for_course', { _course_id: courseId });
      
      if (error) throw error;
      return data?.[0] as ActivePromotion | undefined;
    },
    enabled: !!courseId,
  });
};

export const useActivePromotionForSoftware = (productId: string) => {
  return useQuery({
    queryKey: ['active-promotion-software', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_active_promotion_for_software', { _product_id: productId });
      
      if (error) throw error;
      return data?.[0] as ActivePromotion | undefined;
    },
    enabled: !!productId,
  });
};

export const useCreatePromotion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (promotion: {
      name: string;
      description?: string;
      discount_percentage: number;
      start_date: string;
      end_date: string;
      is_active?: boolean;
      course_ids: string[];
      product_ids: string[];
    }) => {
      const { course_ids, product_ids, ...promotionData } = promotion;
      
      // Create promotion
      const { data: newPromotion, error: promotionError } = await supabase
        .from('promotions')
        .insert(promotionData)
        .select()
        .single();
      
      if (promotionError) throw promotionError;
      
      // Add courses to promotion
      if (course_ids.length > 0) {
        const promotionCourses = course_ids.map(courseId => ({
          promotion_id: newPromotion.id,
          course_id: courseId,
        }));
        
        const { error: coursesError } = await supabase
          .from('promotion_courses')
          .insert(promotionCourses);
        
        if (coursesError) throw coursesError;
      }
      
      // Add software to promotion
      if (product_ids.length > 0) {
        const promotionSoftware = product_ids.map(productId => ({
          promotion_id: newPromotion.id,
          product_id: productId,
        }));
        
        const { error: softwareError } = await supabase
          .from('promotion_software')
          .insert(promotionSoftware);
        
        if (softwareError) throw softwareError;
      }
      
      return newPromotion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Promotion created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create promotion: ${error.message}`);
    },
  });
};

export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      updates,
      course_ids,
      product_ids 
    }: { 
      id: string; 
      updates: Partial<Omit<Promotion, 'id' | 'created_at' | 'updated_at'>>;
      course_ids?: string[];
      product_ids?: string[];
    }) => {
      const { error: updateError } = await supabase
        .from('promotions')
        .update(updates)
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      // Update courses if provided
      if (course_ids !== undefined) {
        // Remove existing courses
        await supabase
          .from('promotion_courses')
          .delete()
          .eq('promotion_id', id);
        
        // Add new courses
        if (course_ids.length > 0) {
          const promotionCourses = course_ids.map(courseId => ({
            promotion_id: id,
            course_id: courseId,
          }));
          
          const { error: coursesError } = await supabase
            .from('promotion_courses')
            .insert(promotionCourses);
          
          if (coursesError) throw coursesError;
        }
      }
      
      // Update software if provided
      if (product_ids !== undefined) {
        // Remove existing software
        await supabase
          .from('promotion_software')
          .delete()
          .eq('promotion_id', id);
        
        // Add new software
        if (product_ids.length > 0) {
          const promotionSoftware = product_ids.map(productId => ({
            promotion_id: id,
            product_id: productId,
          }));
          
          const { error: softwareError } = await supabase
            .from('promotion_software')
            .insert(promotionSoftware);
          
          if (softwareError) throw softwareError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotion-courses'] });
      queryClient.invalidateQueries({ queryKey: ['promotion-software'] });
      toast.success('Promotion updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update promotion: ${error.message}`);
    },
  });
};

export const useDeletePromotion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Promotion deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete promotion: ${error.message}`);
    },
  });
};
