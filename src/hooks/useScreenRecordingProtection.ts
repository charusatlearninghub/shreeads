import { useEffect, useCallback, useState } from 'react';
import { toast } from 'sonner';

export function useScreenRecordingProtection(enabled: boolean = true) {
  const [isRecording, setIsRecording] = useState(false);

  const handleRecordingDetected = useCallback(() => {
    setIsRecording(true);
    toast.error('Screen recording detected! This action is not allowed.', {
      duration: 5000,
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Detect screen capture API usage
    const detectScreenCapture = async () => {
      try {
        // Check if getDisplayMedia is being used
        const originalGetDisplayMedia = navigator.mediaDevices?.getDisplayMedia;
        if (originalGetDisplayMedia) {
          navigator.mediaDevices.getDisplayMedia = async function(constraints) {
            handleRecordingDetected();
            throw new Error('Screen recording is not allowed');
          };
        }
      } catch (e) {
        // Silently fail if API is not available
      }
    };

    detectScreenCapture();

    // Detect common screen recording keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Windows Game Bar (Win + G)
      if (e.key === 'g' && e.metaKey) {
        e.preventDefault();
        handleRecordingDetected();
      }

      // Windows Screen Snip (Win + Shift + S)
      if (e.key === 's' && e.metaKey && e.shiftKey) {
        e.preventDefault();
        handleRecordingDetected();
      }

      // macOS Screenshot (Cmd + Shift + 3/4/5)
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        handleRecordingDetected();
      }

      // Print Screen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        handleRecordingDetected();
      }

      // OBS common shortcut (F9)
      if (e.key === 'F9') {
        e.preventDefault();
        handleRecordingDetected();
      }
    };

    // Detect Picture-in-Picture mode
    const handlePiP = () => {
      handleRecordingDetected();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('enterpictureinpicture', handlePiP);

    // Detect window resize that might indicate screen sharing
    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;
    
    const handleResize = () => {
      const widthChange = Math.abs(window.innerWidth - lastWidth);
      const heightChange = Math.abs(window.innerHeight - lastHeight);
      
      // Significant size change might indicate screen sharing selection
      if (widthChange > 200 || heightChange > 200) {
        // Don't alert on normal resize, just track
      }
      
      lastWidth = window.innerWidth;
      lastHeight = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Detect if browser is being recorded via MediaRecorder
    const checkMediaRecorder = () => {
      const originalMediaRecorder = window.MediaRecorder;
      if (originalMediaRecorder) {
        (window as any).MediaRecorder = class extends originalMediaRecorder {
          constructor(stream: MediaStream, options?: MediaRecorderOptions) {
            // Check if this is a screen capture stream
            const tracks = stream.getVideoTracks();
            for (const track of tracks) {
              const settings = track.getSettings();
              if ((settings as any).displaySurface) {
                handleRecordingDetected();
              }
            }
            super(stream, options);
          }
        };
      }
    };

    checkMediaRecorder();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('enterpictureinpicture', handlePiP);
      window.removeEventListener('resize', handleResize);
    };
  }, [enabled, handleRecordingDetected]);

  return { isRecording };
}
