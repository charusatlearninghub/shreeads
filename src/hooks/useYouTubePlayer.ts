import { useState, useEffect, useCallback, useRef } from 'react';

// YouTube Player types
interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

interface YTPlayerEvent {
  target: YTPlayer;
  data: number;
}

interface YTPlayerOptions {
  videoId: string;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (event: YTPlayerEvent) => void;
    onStateChange?: (event: YTPlayerEvent) => void;
  };
}

interface YTNamespace {
  Player: new (elementId: string, options: YTPlayerOptions) => YTPlayer;
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    YT: YTNamespace;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface UseYouTubePlayerProps {
  videoId: string;
  containerId: string;
  initialProgress?: number;
  onProgressUpdate?: (watchedSeconds: number, isCompleted: boolean) => void;
  onStateChange?: (state: number) => void;
  lessonDuration?: number;
}

interface YouTubePlayerState {
  isReady: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

// Load YouTube IFrame API
function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }

    // Check if script is already loading
    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (existingScript) {
      const checkReady = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkReady);
          resolve();
        }
      }, 100);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    
    window.onYouTubeIframeAPIReady = () => {
      resolve();
    };
    
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  });
}

export function useYouTubePlayer({
  videoId,
  containerId,
  initialProgress = 0,
  onProgressUpdate,
  onStateChange,
  lessonDuration,
}: UseYouTubePlayerProps) {
  const playerRef = useRef<YTPlayer | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [state, setState] = useState<YouTubePlayerState>({
    isReady: false,
    isPlaying: false,
    currentTime: initialProgress,
    duration: lessonDuration || 0,
  });

  // Update progress callback
  const updateProgress = useCallback(() => {
    if (!playerRef.current || !onProgressUpdate) return;
    
    try {
      const currentTime = playerRef.current.getCurrentTime?.() || 0;
      const duration = playerRef.current.getDuration?.() || lessonDuration || 0;
      const isCompleted = duration > 0 && currentTime >= duration * 0.9;
      
      onProgressUpdate(Math.floor(currentTime), isCompleted);
      
      setState(prev => ({
        ...prev,
        currentTime,
        duration,
      }));
    } catch (error) {
      console.error('Error updating YouTube progress:', error);
    }
  }, [onProgressUpdate, lessonDuration]);

  // Initialize player
  useEffect(() => {
    let isMounted = true;

    const initPlayer = async () => {
      await loadYouTubeAPI();
      
      if (!isMounted) return;

      // Destroy existing player
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore destroy errors
        }
        playerRef.current = null;
      }

      // Create new player
      playerRef.current = new window.YT.Player(containerId, {
        videoId,
        playerVars: {
          autoplay: 0,
          rel: 0,
          modestbranding: 1,
          start: Math.floor(initialProgress),
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (!isMounted) return;
            
            setState(prev => ({
              ...prev,
              isReady: true,
              duration: event.target.getDuration?.() || lessonDuration || 0,
            }));
            
            // Seek to initial progress if needed
            if (initialProgress > 0) {
              event.target.seekTo(initialProgress, true);
            }
          },
          onStateChange: (event) => {
            if (!isMounted) return;
            
            const isPlaying = event.data === window.YT.PlayerState.PLAYING;
            
            setState(prev => ({
              ...prev,
              isPlaying,
            }));
            
            onStateChange?.(event.data);
            
            // Start/stop progress tracking
            if (isPlaying) {
              // Update progress every 10 seconds while playing
              progressIntervalRef.current = setInterval(updateProgress, 10000);
            } else {
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
              }
              // Save progress when paused
              updateProgress();
            }
            
            // Mark complete when video ends
            if (event.data === window.YT.PlayerState.ENDED) {
              updateProgress();
            }
          },
        },
      });
    };

    initPlayer();

    return () => {
      isMounted = false;
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore destroy errors
        }
        playerRef.current = null;
      }
    };
  }, [videoId, containerId, initialProgress, updateProgress, onStateChange, lessonDuration]);

  // Player controls
  const play = useCallback(() => {
    playerRef.current?.playVideo?.();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo?.();
  }, []);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo?.(seconds, true);
  }, []);

  const getCurrentTime = useCallback((): number => {
    return playerRef.current?.getCurrentTime?.() || 0;
  }, []);

  const getDuration = useCallback((): number => {
    return playerRef.current?.getDuration?.() || lessonDuration || 0;
  }, [lessonDuration]);

  return {
    ...state,
    play,
    pause,
    seekTo,
    getCurrentTime,
    getDuration,
  };
}
