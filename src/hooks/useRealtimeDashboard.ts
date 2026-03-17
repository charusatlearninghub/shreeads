import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeDashboardOptions {
  onEnrollmentChange?: () => void;
  onUserChange?: () => void;
  onCourseChange?: () => void;
  onPromoCodeChange?: () => void;
  onCertificateChange?: () => void;
}

export function useRealtimeDashboard(options: RealtimeDashboardOptions) {
  const {
    onEnrollmentChange,
    onUserChange,
    onCourseChange,
    onPromoCodeChange,
    onCertificateChange,
  } = options;

  useEffect(() => {
    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Subscribe to enrollments changes
    if (onEnrollmentChange) {
      const enrollmentChannel = supabase
        .channel('dashboard-enrollments')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'enrollments' },
          () => onEnrollmentChange()
        )
        .subscribe();
      channels.push(enrollmentChannel);
    }

    // Subscribe to profiles changes (new users)
    if (onUserChange) {
      const profilesChannel = supabase
        .channel('dashboard-profiles')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          () => onUserChange()
        )
        .subscribe();
      channels.push(profilesChannel);

      const rolesChannel = supabase
        .channel('dashboard-user-roles')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_roles' },
          () => onUserChange()
        )
        .subscribe();
      channels.push(rolesChannel);
    }

    // Subscribe to courses changes
    if (onCourseChange) {
      const coursesChannel = supabase
        .channel('dashboard-courses')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'courses' },
          () => onCourseChange()
        )
        .subscribe();
      channels.push(coursesChannel);
    }

    // Subscribe to promo codes changes
    if (onPromoCodeChange) {
      const promoChannel = supabase
        .channel('dashboard-promo-codes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'promo_codes' },
          () => onPromoCodeChange()
        )
        .subscribe();
      channels.push(promoChannel);
    }

    // Subscribe to certificates changes
    if (onCertificateChange) {
      const certificatesChannel = supabase
        .channel('dashboard-certificates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'certificates' },
          () => onCertificateChange()
        )
        .subscribe();
      channels.push(certificatesChannel);
    }

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [onEnrollmentChange, onUserChange, onCourseChange, onPromoCodeChange, onCertificateChange]);
}
