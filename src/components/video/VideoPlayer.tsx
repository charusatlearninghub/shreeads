import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  SkipBack, 
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { getYouTubeVideoId } from '@/lib/youtube';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { DynamicWatermark } from './DynamicWatermark';
import { SecurityWarningModal } from './SecurityWarningModal';
import { ScreenBlackout } from './ScreenBlackout';
import { useSecurityProtection } from '@/hooks/useSecurityProtection';
import { useSecureVideoUrl } from '@/hooks/useSecureVideoUrl';
import { useAuth } from '@/contexts/AuthContext';

interface Lesson {
  id: string;
  title: string;
  video_url: string | null;
  duration_seconds: number;
  order_index: number;
}

interface VideoPlayerProps {
  lesson: Lesson;
  lessons: Lesson[];
  initialProgress?: number;
  onProgressUpdate: (watchedSeconds: number, isCompleted: boolean) => void;
  onLessonChange: (lessonId: string) => void;
  userEmail?: string;
  lessonTitle?: string;
}

// YouTube Player Component with API integration
const YouTubePlayerComponent = React.forwardRef<{ pause: () => void }, {
  videoId: string;
  lessonId: string;
  initialProgress: number;
  onProgressUpdate: (watchedSeconds: number, isCompleted: boolean) => void;
  lessonDuration: number;
}>(({ videoId, lessonId, initialProgress, onProgressUpdate, lessonDuration }, ref) => {
  const containerId = `youtube-player-${lessonId}`;
  
  const { pause } = useYouTubePlayer({
    videoId,
    containerId,
    initialProgress,
    onProgressUpdate,
    lessonDuration,
  });

  React.useImperativeHandle(ref, () => ({ pause }));

  return (
    <div 
      id={containerId}
      className="w-full h-full"
    />
  );
});

export function VideoPlayer({
  lesson,
  lessons,
  initialProgress = 0,
  onProgressUpdate,
  onLessonChange,
  userEmail,
  lessonTitle,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const { user, profile } = useAuth();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const currentIndex = lessons.findIndex(l => l.id === lesson.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < lessons.length - 1;
  
  const youtubeVideoId = getYouTubeVideoId(lesson.video_url);
  const isYouTube = !!youtubeVideoId;

  // Reset playback error when lesson or source changes
  useEffect(() => {
    setPlaybackError(null);
  }, [lesson.id, lesson.video_url]);

  // Secure video URL - fetches signed URL via edge function (auth required for non-YouTube)
  const { url: secureVideoUrl, isLoading: isVideoUrlLoading, error: videoUrlError, refreshUrl } = useSecureVideoUrl(
    lesson.id,
    lesson.video_url
  );

  // Security protection system
  const {
    isDevToolsOpen,
    isScreenRecording,
    isTabBlurred,
    showSecurityWarning,
    securityMessage,
    watermarkData,
    dismissWarning,
    sessionId,
    isProtected,
  } = useSecurityProtection({
    enabled: hasAcceptedTerms,
    userId: user?.id,
    userEmail: userEmail || profile?.email || '',
    userName: profile?.full_name || '',
  });

  // Reference to YouTube player for auto-pause
  const ytPlayerRef = useRef<{ pause: () => void } | null>(null);

  // Pause video (native + YouTube) when protection is active
  useEffect(() => {
    if (isProtected) {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      ytPlayerRef.current?.pause();
    }
  }, [isProtected]);

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Disable PiP and drag
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if ('disablePictureInPicture' in video) {
        (video as any).disablePictureInPicture = true;
      }
    }

    const handleDragStart = (e: DragEvent) => {
      if (containerRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
    };
    document.addEventListener('dragstart', handleDragStart, true);
    return () => document.removeEventListener('dragstart', handleDragStart, true);
  }, []);

  // Handle progress update for non-YouTube videos
  const updateProgress = useCallback(() => {
    if (isYouTube) return;
    if (videoRef.current) {
      const watchedSeconds = Math.floor(videoRef.current.currentTime);
      const isCompleted = duration > 0 && watchedSeconds >= duration * 0.9;
      onProgressUpdate(watchedSeconds, isCompleted);
    }
  }, [duration, onProgressUpdate, isYouTube]);

  useEffect(() => {
    if (isYouTube) return;
    const video = videoRef.current;
    if (video && initialProgress > 0) {
      video.currentTime = initialProgress;
    }
  }, [initialProgress, lesson.id, isYouTube]);

  useEffect(() => {
    if (isYouTube) return;
    if (isPlaying) {
      progressInterval.current = setInterval(updateProgress, 10000);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
      updateProgress();
    }
    return () => { if (progressInterval.current) clearInterval(progressInterval.current); };
  }, [isPlaying, updateProgress, isYouTube]);

  useEffect(() => {
    if (isYouTube) return;
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3000);
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', () => { if (isPlaying) setShowControls(false); });
    }
    return () => { clearTimeout(timeout); if (container) container.removeEventListener('mousemove', handleMouseMove); };
  }, [isPlaying, isYouTube]);

  useEffect(() => {
    if (isYouTube) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      switch (e.key) {
        case ' ': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': videoRef.current.currentTime -= 10; break;
        case 'ArrowRight': videoRef.current.currentTime += 10; break;
        case 'ArrowUp': setVolume(prev => Math.min(1, prev + 0.1)); break;
        case 'ArrowDown': setVolume(prev => Math.max(0, prev - 0.1)); break;
        case 'f': toggleFullscreen(); break;
        case 'm': setIsMuted(prev => !prev); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isYouTube]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    const el = containerRef.current as any;
    const doc = document as any;

    const requestFS = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    const exitFS = doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
    const fsElement = doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement;

    if (!fsElement) {
      if (requestFS) {
        try {
          await requestFS.call(el);
          setIsFullscreen(true);
          return;
        } catch {}
      }
      setIsFullscreen(true);
    } else {
      if (exitFS) {
        try { await exitFS.call(doc); } catch {}
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => {
      const doc = document as any;
      const fsElement = doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement;
      if (!fsElement) setIsFullscreen(false);
    };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, []);

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) videoRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
    }
  };

  const goToPreviousLesson = () => { if (hasPrevious) onLessonChange(lessons[currentIndex - 1].id); };
  const goToNextLesson = () => { if (hasNext) onLessonChange(lessons[currentIndex + 1].id); };

  const handleNextLesson = () => {
    setIsPlaying(false);
    updateProgress();
    goToNextLesson();
  };

  // Use secure URL instead of direct video_url. Only use URLs that are valid for <video src> (absolute URLs).
  const videoUrl = isYouTube ? '' : (secureVideoUrl || '');
  const hasNoPlayableUrl = !isYouTube && !isVideoUrlLoading && !videoUrl && !!lesson.video_url;
  const hasApiError = !isYouTube && videoUrlError;
  const hasPlaybackError = !isYouTube && playbackError;
  const showNativeVideoError = hasNoPlayableUrl || hasApiError || (hasPlaybackError && !videoUrl);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative bg-black rounded-lg overflow-hidden group",
        isFullscreen ? "fixed inset-0 z-[9999] rounded-none w-screen h-screen" : "aspect-video"
      )}
      data-sensitive="true"
    >
      {/* Full-page Screen Blackout */}
      <ScreenBlackout
        isActive={isProtected && hasAcceptedTerms}
        reason={
          isScreenRecording ? 'recording' :
          isDevToolsOpen ? 'devtools' :
          isTabBlurred ? 'tab_blur' : null
        }
        onDismiss={dismissWarning}
      />

      {/* Transparent protection layer - interferes with capture tools */}
      <div
        className="video-protection-layer absolute inset-0 z-20 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.02), rgba(255,255,255,0.02) 2px, transparent 2px, transparent 4px)',
        }}
        aria-hidden="true"
      />

      {/* Dynamic corner watermark: email • time • ShreeAds — updates every few sec, position every 10s */}
      {hasAcceptedTerms && !isProtected && watermarkData.email && (
        <div
          className="absolute z-30 pointer-events-none select-none text-white/70 text-xs font-mono whitespace-nowrap transition-[left,top] duration-300"
          style={{
            left: [0, undefined, 0, undefined][watermarkData.corner ?? 0] ?? 'auto',
            right: [undefined, 0, undefined, 0][watermarkData.corner ?? 0] ?? 'auto',
            top: [0, 0, undefined, undefined][watermarkData.corner ?? 0] ?? 'auto',
            bottom: [undefined, undefined, 0, 0][watermarkData.corner ?? 0] ?? 'auto',
            margin: '8px',
            textShadow: '0 0 4px rgba(0,0,0,0.8)',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          {watermarkData.email} • {watermarkData.timestamp}
          {watermarkData.ip ? ` • ${watermarkData.ip}` : ''} • ShreeAds
        </div>
      )}

      {/* Anti-recording overlay - semi-transparent layer that shows in recordings */}
      {hasAcceptedTerms && !isProtected && (
        <div 
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.008) 35px, rgba(255,255,255,0.008) 70px)',
            mixBlendMode: 'overlay',
          }}
        />
      )}

      {/* Loading state for secure URL */}
      {!isYouTube && isVideoUrlLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-white text-sm">Securing video stream...</span>
        </div>
      )}

      {/* Error overlay: only when no URL (API failed) or auth error — so video can still show with native controls when URL exists */}
      {showNativeVideoError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 p-4 text-center">
          <p className="text-white font-medium mb-1">Video unavailable</p>
          <p className="text-white/80 text-sm max-w-sm mb-4">
            {videoUrlError === 'Unauthorized' || videoUrlError?.toLowerCase().includes('invalid token')
              ? 'Please log in to watch this video.'
              : videoUrlError || 'This video could not be loaded. Please try again later.'}
          </p>
          {!isYouTube && videoUrlError && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setPlaybackError(null);
                refreshUrl();
              }}
            >
              Try again
            </Button>
          )}
        </div>
      )}

      {/* YouTube Embed */}
      {isYouTube && youtubeVideoId ? (
        <div key={youtubeVideoId} className={cn("w-full h-full relative", isProtected && "blur-xl pointer-events-none")}>
          <YouTubePlayerComponent
            ref={ytPlayerRef}
            videoId={youtubeVideoId}
            lessonId={lesson.id}
            initialProgress={initialProgress}
            onProgressUpdate={onProgressUpdate}
            lessonDuration={lesson.duration_seconds}
          />
          <DynamicWatermark data={watermarkData} visible={!isProtected && hasAcceptedTerms} />
        </div>
      ) : (
        <>
          {videoUrl && (
            <>
            <video
              key={videoUrl}
              ref={videoRef}
              src={videoUrl}
              className={cn(
                "w-full h-full object-contain transition-all",
                isProtected && "blur-xl"
              )}
              playsInline
              preload="auto"
              controlsList="nodownload noremoteplayback"
              disablePictureInPicture
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={handleNextLesson}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                const d = v.duration;
                if (Number.isFinite(d)) setDuration(d);
                if (initialProgress > 0) v.currentTime = initialProgress;
              }}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                setCurrentTime(v.currentTime);
                if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
              }}
              onContextMenu={(e) => e.preventDefault()}
              onError={(e) => {
                // Surface playback errors (CORS, 403, format not supported, network).
                // Avoid crossOrigin on <video> so signed URLs work without CORS preflight.
                const target = e.currentTarget;
                const code = target.error?.code;
                const message = target.error?.message || 'Playback failed';
                console.warn('Video load/playback error:', message, code);
                if (code === 2) setPlaybackError('Video file not found or access denied.');
                else if (code === 3) setPlaybackError('Video decoding failed. The file may be corrupted or in an unsupported format.');
                else if (code === 4) setPlaybackError('Format or source not supported. Try refreshing the page or use MP4 in a modern browser.');
                else setPlaybackError(message || 'Video could not be played.');
              }}
            />
            {hasPlaybackError && (
              <div className="absolute bottom-14 left-0 right-0 flex justify-center z-20">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPlaybackError(null);
                    refreshUrl();
                  }}
                >
                  Try again
                </Button>
              </div>
            )}
            </>
          )}

          <DynamicWatermark data={watermarkData} visible={!isProtected && hasAcceptedTerms} />

          {/* Play overlay when paused */}
          {!isPlaying && !isVideoUrlLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/30 play-overlay z-15"
            >
              <button
                type="button"
                onClick={() => videoRef.current?.play()}
                className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center hover:bg-primary transition-colors"
                aria-label="Play"
              >
                <Play className="w-8 h-8 text-white ml-1" />
              </button>
            </motion.div>
          )}
        </>
      )}

      {/* Controls (non-YouTube) */}
      {!isYouTube && (
        <motion.div
          initial={false}
          animate={{ opacity: showControls ? 1 : 0 }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-25"
        >
          <div className="mb-4">
            <div className="relative h-1 bg-white/20 rounded-full cursor-pointer group/progress">
              <div className="absolute h-full bg-white/30 rounded-full" style={{ width: `${(buffered / duration) * 100}%` }} />
              <Slider value={[currentTime]} max={duration || 100} step={0.1} onValueChange={handleSeek} className="absolute inset-0" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={goToPreviousLesson} disabled={!hasPrevious}>
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={togglePlay}>
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={goToNextLesson} disabled={!hasNext}>
                <SkipForward className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2 group/volume">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={toggleMute}>
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                <div className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-200">
                  <Slider value={[isMuted ? 0 : volume]} max={1} step={0.01} onValueChange={handleVolumeChange} />
                </div>
              </div>
              <span className="text-white text-sm">{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={toggleFullscreen}>
                <Maximize className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Lesson Navigation Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-25">
        <Button variant="ghost" size="sm" className="text-white bg-black/40 hover:bg-black/60" onClick={goToPreviousLesson} disabled={!hasPrevious}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </Button>
        <div className="bg-black/40 px-3 py-1 rounded-full">
          <span className="text-white text-sm">Lesson {currentIndex + 1} of {lessons.length}</span>
        </div>
        <Button variant="ghost" size="sm" className="text-white bg-black/40 hover:bg-black/60" onClick={goToNextLesson} disabled={!hasNext}>
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
