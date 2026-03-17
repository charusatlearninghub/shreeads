import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SESSION_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const SESSION_WARNING_BEFORE_EXPIRY = 5 * 60 * 1000; // 5 minutes before expiry

export function useSessionRefresh() {
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        return false;
      }

      if (!session) {
        return false;
      }

      // Check if token is close to expiring
      const expiresAt = session.expires_at;
      if (expiresAt) {
        const expiryTime = expiresAt * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;

        // If less than 5 minutes until expiry, refresh
        if (timeUntilExpiry < SESSION_WARNING_BEFORE_EXPIRY) {
          const { data, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('Failed to refresh session:', refreshError);
            toast.error('Session expired. Please log in again.');
            return false;
          }

          if (data.session) {
            console.log('Session refreshed successfully');
            return true;
          }
        }
      }

      return true;
    } catch (err) {
      console.error('Session refresh failed:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    // Initial check
    refreshSession();

    // Set up interval for periodic refresh
    const intervalId = setInterval(refreshSession, SESSION_REFRESH_INTERVAL);

    // Set up visibility change handler to refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set up focus handler
    const handleFocus = () => {
      refreshSession();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshSession]);

  return { refreshSession };
}
