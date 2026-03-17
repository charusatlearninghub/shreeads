import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecureVideoResult {
  url: string | null;
  type: 'youtube' | 'signed' | 'direct' | null;
  isLoading: boolean;
  error: string | null;
  refreshUrl: () => void;
}

export function useSecureVideoUrl(lessonId: string, originalUrl: string | null): SecureVideoResult {
  const [url, setUrl] = useState<string | null>(null);
  const [type, setType] = useState<'youtube' | 'signed' | 'direct' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSecureUrl = useCallback(async () => {
    if (!lessonId || !originalUrl) return;

    // YouTube URLs don't need secure wrapping
    if (originalUrl.includes('youtube.com') || originalUrl.includes('youtu.be')) {
      setUrl(originalUrl);
      setType('youtube');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-video-url', {
        body: { lessonId },
      });

      if (fnError) throw fnError;
      if (!data?.url) {
        setError('No video URL returned');
        setUrl(null);
        setType(null);
        return;
      }

      setUrl(data.url);
      setType(data.type);

      // Auto-refresh signed URLs before they expire
      if (data.type === 'signed' && data.expiresIn) {
        // Refresh 2 minutes before expiry
        const refreshIn = Math.max((data.expiresIn - 120) * 1000, 60000);
        refreshTimerRef.current = setTimeout(fetchSecureUrl, refreshIn);
      }
    } catch (err: any) {
      console.error('Failed to get secure video URL:', err);
      setError(err.message || 'Failed to load video');
      // Only fallback to originalUrl if it's a valid absolute URL (e.g. external CDN).
      // Storage paths like "folder/video.mp4" must go through the API and cannot be used as src.
      const isAbsoluteUrl = originalUrl.startsWith('http://') || originalUrl.startsWith('https://');
      if (isAbsoluteUrl) {
        setUrl(originalUrl);
        setType('direct');
      } else {
        setUrl(null);
        setType(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, originalUrl]);

  useEffect(() => {
    fetchSecureUrl();
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [fetchSecureUrl]);

  return { url, type, isLoading, error, refreshUrl: fetchSecureUrl };
}
