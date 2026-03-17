// YouTube URL validation and utilities

const YOUTUBE_URL_PATTERNS = [
  /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:&.*)?$/,
  /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
  /^(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
  /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
  /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
];

/**
 * Extract YouTube video ID from various URL formats
 */
export function getYouTubeVideoId(url: string | null): string | null {
  if (!url) return null;
  
  const trimmedUrl = url.trim();
  
  // Check if it's just a video ID (11 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmedUrl)) {
    return trimmedUrl;
  }
  
  for (const pattern of YOUTUBE_URL_PATTERNS) {
    const match = trimmedUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Check if a URL is a valid YouTube URL
 */
export function isValidYouTubeUrl(url: string | null): boolean {
  return getYouTubeVideoId(url) !== null;
}

/**
 * Check if a URL looks like it's attempting to be a YouTube URL but is invalid
 */
export function looksLikeYouTubeUrl(url: string | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes('youtube') || lower.includes('youtu.be');
}

/**
 * Validate video URL - returns error message or null if valid
 */
export function validateVideoUrl(url: string): string | null {
  if (!url || !url.trim()) {
    return null; // Empty is allowed
  }
  
  const trimmedUrl = url.trim();
  
  // Check if it looks like a YouTube URL
  if (looksLikeYouTubeUrl(trimmedUrl)) {
    if (!isValidYouTubeUrl(trimmedUrl)) {
      return 'Invalid YouTube URL. Please use a valid format like: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID';
    }
    return null;
  }
  
  // For non-YouTube URLs, just check if it's a valid URL
  try {
    new URL(trimmedUrl);
    return null;
  } catch {
    return 'Please enter a valid URL';
  }
}

/**
 * Get YouTube embed URL from video URL
 */
export function getYouTubeEmbedUrl(url: string | null, startSeconds: number = 0): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  
  const params = new URLSearchParams({
    enablejsapi: '1',
    origin: window.location.origin,
    rel: '0',
    modestbranding: '1',
  });
  
  if (startSeconds > 0) {
    params.set('start', Math.floor(startSeconds).toString());
  }
  
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Get YouTube thumbnail URL
 */
export function getYouTubeThumbnailUrl(url: string | null, quality: 'default' | 'medium' | 'high' | 'max' = 'high'): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    max: 'maxresdefault',
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}
