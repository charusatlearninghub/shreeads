import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminNotification {
  id: string;
  type: 'enrollment' | 'completion' | 'promo_code' | 'new_user';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, unknown>;
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((notification: Omit<AdminNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: AdminNotification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    setUnreadCount(prev => prev + 1);
    
    // Show toast notification
    toast(notification.title, {
      description: notification.message,
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    // Subscribe to enrollments
    const enrollmentChannel = supabase
      .channel('admin-enrollments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'enrollments' },
        async (payload) => {
          const enrollment = payload.new as { user_id: string; course_id: string };
          
          // Fetch user and course details
          const [userRes, courseRes] = await Promise.all([
            supabase.from('profiles').select('full_name, email').eq('id', enrollment.user_id).maybeSingle(),
            supabase.from('courses').select('title').eq('id', enrollment.course_id).maybeSingle()
          ]);
          
          const userName = userRes.data?.full_name || userRes.data?.email || 'A user';
          const courseName = courseRes.data?.title || 'a course';
          
          addNotification({
            type: 'enrollment',
            title: 'New Enrollment',
            message: `${userName} enrolled in "${courseName}"`,
            data: { userId: enrollment.user_id, courseId: enrollment.course_id }
          });
        }
      )
      .subscribe();

    // Subscribe to certificates (course completions)
    const certificateChannel = supabase
      .channel('admin-certificates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'certificates' },
        async (payload) => {
          const certificate = payload.new as { user_id: string; course_id: string };
          
          const [userRes, courseRes] = await Promise.all([
            supabase.from('profiles').select('full_name, email').eq('id', certificate.user_id).maybeSingle(),
            supabase.from('courses').select('title').eq('id', certificate.course_id).maybeSingle()
          ]);
          
          const userName = userRes.data?.full_name || userRes.data?.email || 'A user';
          const courseName = courseRes.data?.title || 'a course';
          
          addNotification({
            type: 'completion',
            title: 'Course Completed',
            message: `${userName} completed "${courseName}" and earned a certificate`,
            data: { userId: certificate.user_id, courseId: certificate.course_id }
          });
        }
      )
      .subscribe();

    // Subscribe to promo code usage
    const promoChannel = supabase
      .channel('admin-promo-codes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'promo_codes' },
        async (payload) => {
          const promoCode = payload.new as { is_used: boolean; used_by: string | null; code: string; course_id: string };
          const oldPromoCode = payload.old as { is_used: boolean };
          
          // Only trigger if promo code was just used
          if (promoCode.is_used && !oldPromoCode.is_used && promoCode.used_by) {
            const [userRes, courseRes] = await Promise.all([
              supabase.from('profiles').select('full_name, email').eq('id', promoCode.used_by).maybeSingle(),
              supabase.from('courses').select('title').eq('id', promoCode.course_id).maybeSingle()
            ]);
            
            const userName = userRes.data?.full_name || userRes.data?.email || 'A user';
            const courseName = courseRes.data?.title || 'a course';
            
            addNotification({
              type: 'promo_code',
              title: 'Promo Code Redeemed',
              message: `${userName} redeemed code "${promoCode.code}" for "${courseName}"`,
              data: { code: promoCode.code, userId: promoCode.used_by }
            });
          }
        }
      )
      .subscribe();

    // Subscribe to new user registrations
    const profilesChannel = supabase
      .channel('admin-profiles')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          const profile = payload.new as { full_name: string | null; email: string };
          const userName = profile.full_name || profile.email;
          
          addNotification({
            type: 'new_user',
            title: 'New User Registered',
            message: `${userName} joined the platform`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(enrollmentChannel);
      supabase.removeChannel(certificateChannel);
      supabase.removeChannel(promoChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [addNotification]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}
