import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityProtectionOptions {
  enabled: boolean;
  userId?: string;
  userEmail?: string;
  userName?: string;
}

export function useSecurityProtection({ enabled, userId, userEmail, userName }: SecurityProtectionOptions) {
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [isScreenRecording, setIsScreenRecording] = useState(false);
  const [isTabBlurred, setIsTabBlurred] = useState(false);
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [securityMessage, setSecurityMessage] = useState('');
  const [watermarkPosition, setWatermarkPosition] = useState({ x: 20, y: 20 });
  const [watermarkTimestamp, setWatermarkTimestamp] = useState(() => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
  const [watermarkCorner, setWatermarkCorner] = useState(0); // 0=TL, 1=TR, 2=BL, 3=BR
  const [userIp, setUserIp] = useState('');
  const [sessionId] = useState(() => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const incidentLogged = useRef<Set<string>>(new Set());

  // Fetch user IP
  useEffect(() => {
    if (!enabled) return;
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => setUserIp(d.ip))
      .catch(() => setUserIp('unknown'));
  }, [enabled]);

  // Log security incident
  const logIncident = useCallback(async (type: string, details: Record<string, unknown> = {}) => {
    const key = `${type}-${Math.floor(Date.now() / 60000)}`;
    if (incidentLogged.current.has(key) || !userId) return;
    incidentLogged.current.add(key);

    try {
      await supabase.from('security_incidents').insert({
        user_id: userId,
        incident_type: type,
        details: { ...details, email: userEmail, sessionId, timestamp: new Date().toISOString() },
        ip_address: userIp,
        user_agent: navigator.userAgent,
      });
    } catch {
      // Silently fail
    }
  }, [userId, userEmail, userIp, sessionId]);

  const triggerAlert = useCallback((type: string, message: string) => {
    setShowSecurityWarning(true);
    setSecurityMessage(message);
    logIncident(type, { message });
  }, [logIncident]);

  useEffect(() => {
    if (!enabled) return;

    // === 1. DevTools Detection ===
    let devToolsInterval: NodeJS.Timeout;
    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      if (widthThreshold || heightThreshold) {
        setIsDevToolsOpen(true);
        triggerAlert('devtools_open', 'Developer tools detected via window size');
      }
    };
    devToolsInterval = setInterval(detectDevTools, 3000);

    // === 2. Console Protection ===
    const noop = () => {};
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    };
    if (typeof window !== 'undefined') {
      console.log = noop;
      console.warn = noop;
      console.info = noop;
      console.debug = noop;
    }

    // === 3. Right-click & Keyboard Shortcut Prevention ===
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerAlert('right_click', 'Right-click attempted');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') { e.preventDefault(); triggerAlert('devtools_shortcut', 'F12 pressed'); return; }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i','j','c'].includes(e.key.toLowerCase())) {
        e.preventDefault(); triggerAlert('devtools_shortcut', 'Inspect shortcut pressed'); return;
      }
      if ((e.ctrlKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault(); triggerAlert('view_source', 'View source attempted'); return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault(); triggerAlert('save_page', 'Save page attempted'); return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault(); triggerAlert('print_attempt', 'Print attempted'); return;
      }
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        setIsScreenRecording(true);
        triggerAlert('screenshot', 'Print screen attempted');
        try { navigator.clipboard.writeText('Screenshots are not allowed on this content.'); } catch {}
        return;
      }
      if (e.metaKey && e.shiftKey && ['3','4','5'].includes(e.key)) {
        e.preventDefault();
        setIsScreenRecording(true);
        triggerAlert('screenshot', 'macOS screenshot shortcut');
        return;
      }
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setIsScreenRecording(true);
        triggerAlert('screenshot', 'Windows snipping tool');
        return;
      }
      if (e.metaKey && e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setIsScreenRecording(true);
        triggerAlert('screen_recording', 'Windows game bar recording');
        return;
      }
      if (e.key === 'g' && e.metaKey) {
        e.preventDefault();
        setIsScreenRecording(true);
        triggerAlert('screen_recording', 'Windows Game Bar opened');
        return;
      }
      if (e.key === 'F9') {
        e.preventDefault();
        setIsScreenRecording(true);
        triggerAlert('screen_recording', 'OBS recording shortcut detected');
        return;
      }
    };

    // === 4. Tab/Window Blur Detection + CSS Content Hiding ===
    const hideContentCSS = () => {
      document.querySelectorAll('video, iframe, .video-container, [data-sensitive]').forEach(el => {
        (el as HTMLElement).style.visibility = 'hidden';
        (el as HTMLElement).style.filter = 'blur(40px)';
      });
      document.body.classList.add('security-blur-active');
    };

    const showContentCSS = () => {
      document.querySelectorAll('video, iframe, .video-container, [data-sensitive]').forEach(el => {
        (el as HTMLElement).style.visibility = 'visible';
        (el as HTMLElement).style.filter = 'none';
      });
      document.body.classList.remove('security-blur-active');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTabBlurred(true);
        hideContentCSS();
        logIncident('tab_switch', { action: 'tab_hidden' });
      } else {
        setIsTabBlurred(false);
        showContentCSS();
      }
    };

    const handleBlur = () => { setIsTabBlurred(true); hideContentCSS(); };
    const handleFocus = () => { setIsTabBlurred(false); showContentCSS(); };

    // === 5. Screen Capture API Interception ===
    if ('mediaDevices' in navigator && navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia = async function () {
        setIsScreenRecording(true);
        triggerAlert('screen_sharing', 'Screen sharing detected via getDisplayMedia');
        throw new Error('Screen sharing is not allowed');
      };
    }

    const originalMediaRecorder = window.MediaRecorder;
    if (originalMediaRecorder) {
      (window as any).MediaRecorder = class extends originalMediaRecorder {
        constructor(stream: MediaStream, options?: MediaRecorderOptions) {
          const tracks = stream.getVideoTracks();
          for (const track of tracks) {
            const settings = track.getSettings();
            if ((settings as any).displaySurface) {
              setIsScreenRecording(true);
              triggerAlert('screen_recording', 'Screen recording via MediaRecorder detected');
            }
          }
          super(stream, options);
        }
      };
    }

    // Intercept captureStream on canvas
    const origCanvasCapture = HTMLCanvasElement.prototype.captureStream;
    if (origCanvasCapture) {
      HTMLCanvasElement.prototype.captureStream = function (...args: any[]) {
        setIsScreenRecording(true);
        triggerAlert('screen_recording', 'Canvas capture stream detected');
        return origCanvasCapture.apply(this, args);
      };
    }

    // PiP detection
    const handlePiP = () => {
      setIsScreenRecording(true);
      triggerAlert('pip_mode', 'Picture-in-Picture detected');
    };

    // === 6. FPS Drop Detection (recording indicator) ===
    let frameCount = 0;
    let lastFpsCheck = performance.now();
    let lowFpsCount = 0;
    let fpsRafId: number;
    const checkFps = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastFpsCheck >= 2000) {
        const fps = (frameCount / ((now - lastFpsCheck) / 1000));
        if (fps < 12) {
          lowFpsCount++;
          logIncident('fps_drop', { fps: Math.round(fps), consecutiveDrops: lowFpsCount });
          if (lowFpsCount >= 3) {
            setIsScreenRecording(true);
            triggerAlert('screen_recording', 'Sustained performance drop detected - possible recording');
          }
        } else {
          lowFpsCount = 0;
        }
        frameCount = 0;
        lastFpsCheck = now;
      }
      fpsRafId = requestAnimationFrame(checkFps);
    };
    fpsRafId = requestAnimationFrame(checkFps);

    // === 7. Active screen capture detection ===
    let screenCheckInterval: NodeJS.Timeout;
    const checkActiveScreenCapture = async () => {
      try {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
          const stream = (video as HTMLVideoElement).srcObject as MediaStream;
          if (stream) {
            stream.getVideoTracks().forEach(track => {
              const settings = track.getSettings();
              if ((settings as any).displaySurface) {
                setIsScreenRecording(true);
                triggerAlert('screen_recording', 'Active screen capture stream detected');
              }
            });
          }
        });
      } catch {}
    };
    screenCheckInterval = setInterval(checkActiveScreenCapture, 3000);

    // === 8. Permissions API ===
    const checkScreenCapturePermission = async () => {
      try {
        if ('permissions' in navigator) {
          const status = await (navigator.permissions as any).query({ name: 'display-capture' as any });
          if (status.state === 'granted') {
            logIncident('screen_capture_permission', { state: status.state });
          }
          status.addEventListener('change', () => {
            if (status.state === 'granted') {
              logIncident('screen_capture_permission', { state: 'granted' });
            }
          });
        }
      } catch {}
    };
    checkScreenCapturePermission();

    // === 9. Disable drag & text selection on sensitive content ===
    const handleDragStart = (e: DragEvent) => e.preventDefault();
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-sensitive], .video-container, video, iframe')) {
        e.preventDefault();
      }
    };

    // === 10. Detect copy attempts ===
    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-sensitive]')) {
        e.preventDefault();
        logIncident('copy_attempt', { action: 'copy_blocked' });
      }
    };

    // === 11. Mobile touch protection - long press prevention ===
    let touchTimer: NodeJS.Timeout;
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-sensitive], video, iframe')) {
        touchTimer = setTimeout(() => {
          e.preventDefault();
          logIncident('long_press', { action: 'long_press_blocked' });
        }, 500);
      }
    };
    const handleTouchEnd = () => {
      clearTimeout(touchTimer);
    };

    // === 12. Canvas poisoning - prevent canvas-based screenshots ===
    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (...args: any[]) {
      logIncident('canvas_capture', { action: 'toDataURL called' });
      return origToDataURL.apply(this, args);
    };

    const origToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (...args: any[]) {
      logIncident('canvas_capture', { action: 'toBlob called' });
      return origToBlob.apply(this, args);
    };

    // Attach listeners
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('dragstart', handleDragStart, true);
    document.addEventListener('selectstart', handleSelectStart, true);
    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('enterpictureinpicture', handlePiP);

    return () => {
      clearInterval(devToolsInterval);
      clearInterval(screenCheckInterval);
      clearTimeout(touchTimer);
      cancelAnimationFrame(fpsRafId);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('dragstart', handleDragStart, true);
      document.removeEventListener('selectstart', handleSelectStart, true);
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('enterpictureinpicture', handlePiP);
      Object.assign(console, originalConsole);
      HTMLCanvasElement.prototype.toDataURL = origToDataURL;
      HTMLCanvasElement.prototype.toBlob = origToBlob;
      showContentCSS();
    };
  }, [enabled, triggerAlert, logIncident]);

  // Dynamic watermark: timestamp updates every 3s; corner position rotates every 10s (top-left, top-right, bottom-left, bottom-right)
  useEffect(() => {
    if (!enabled) return;
    const tsInterval = setInterval(() => {
      setWatermarkTimestamp(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    }, 3000);
    return () => clearInterval(tsInterval);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const cornerInterval = setInterval(() => {
      setWatermarkCorner((c) => (c + 1) % 4);
    }, 10000);
    return () => clearInterval(cornerInterval);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      setWatermarkPosition({
        x: Math.random() * 60 + 10,
        y: Math.random() * 60 + 10,
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [enabled]);

  const dismissWarning = useCallback(() => {
    setShowSecurityWarning(false);
    setIsScreenRecording(false);
    setIsDevToolsOpen(false);
  }, []);

  const watermarkData = {
    email: userEmail || '',
    name: userName || '',
    ip: userIp,
    timestamp: watermarkTimestamp,
    position: watermarkPosition,
    corner: watermarkCorner,
    sessionId,
  };

  return {
    isDevToolsOpen,
    isScreenRecording,
    isTabBlurred,
    showSecurityWarning,
    securityMessage,
    watermarkData,
    dismissWarning,
    sessionId,
    isProtected: isDevToolsOpen || isScreenRecording || isTabBlurred,
  };
}
