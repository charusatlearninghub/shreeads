import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecureVideoResult {
  url: string | null;
  type: 'youtube' | 'signed' | 'direct' | null;
  isLoading: boolean;
  error: string | null;
  refreshUrl: () => void;
}

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Calls the get-video-url edge function with explicit auth + a single retry.
 * Uses raw fetch (not supabase.functions.invoke) so we get clearer errors and
 * full control over the Authorization header — invoke() sometimes reports a
 * generic "Failed to send a request to the Edge Function" on transient
 * network/cold-start failures.
 */
async function callGetVideoUrl(lessonId: string, attempt = 0): Promise<any> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    throw new Error('You must be signed in to watch this video.');
  }

  const endpoint = `${SUPABASE_URL}/functions/v1/get-video-url`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ lessonId }),
    });
  } catch (networkErr) {
    // Transient network failure — retry once
    if (attempt === 0) {
      await new Promise((r) => setTimeout(r, 600));
      return callGetVideoUrl(lessonId, attempt + 1);
    }
    throw new Error('Video failed to load. Please check your connection and try again.');
  }

  if (!response.ok) {
    let errBody: any = null;
    try {
      errBody = await response.json();
    } catch {
      // ignore
    }
    // Retry on 5xx (cold start / transient)
    if (response.status >= 500 && attempt === 0) {
      await new Promise((r) => setTimeout(r, 600));
      return callGetVideoUrl(lessonId, attempt + 1);
    }
    const msg =
      errBody?.error ||
      (response.status === 401
        ? 'Your session expired. Please sign in again.'
        : response.status === 403
          ? 'You are not enrolled in this course.'
          : response.status === 404
            ? 'This lesson video is not available.'
            : 'Video failed to load. Please refresh the page or try again.');
    throw new Error(msg);
  }

  return response.json();
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
      const data = await callGetVideoUrl(lessonId);

      if (!data?.url) {
        throw new Error('No video URL returned by the server.');
      }

      setUrl(data.url);
      setType(data.type);

      // Auto-refresh signed URLs before they expire
      if (data.type === 'signed' && data.expiresIn) {
        const refreshIn = Math.max((data.expiresIn - 120) * 1000, 60000);
        refreshTimerRef.current = setTimeout(fetchSecureUrl, refreshIn);
      }
    } catch (err: any) {
      console.error('Failed to get secure video URL:', err);
      const message = err?.message || 'Video failed to load. Please refresh the page or try again.';
      setError(message);
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
