/**
 * Generate a thumbnail from a video file
 * @param file - Video file to generate thumbnail from
 * @param seekTime - Time in seconds to capture the thumbnail (default: 1 second)
 * @returns Promise<Blob> - Thumbnail image as a Blob
 */
export function generateVideoThumbnail(file: File, seekTime: number = 1): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      URL.revokeObjectURL(video.src);
      video.remove();
      canvas.remove();
    };

    video.onloadedmetadata = () => {
      // Seek to the specified time or 10% of video duration
      const targetTime = Math.min(seekTime, video.duration * 0.1);
      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      // Set canvas dimensions (max 640px width for thumbnail)
      const maxWidth = 640;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          cleanup();
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        },
        'image/jpeg',
        0.8
      );
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video'));
    };

    // Create object URL for the video file
    video.src = URL.createObjectURL(file);
    video.load();
  });
}

/**
 * Generate a thumbnail from a video URL
 * @param videoUrl - URL of the video
 * @param seekTime - Time in seconds to capture the thumbnail
 * @returns Promise<Blob> - Thumbnail image as a Blob
 */
export function generateThumbnailFromUrl(videoUrl: string, seekTime: number = 1): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      video.remove();
      canvas.remove();
    };

    video.onloadedmetadata = () => {
      const targetTime = Math.min(seekTime, video.duration * 0.1);
      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      const maxWidth = 640;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          cleanup();
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        },
        'image/jpeg',
        0.8
      );
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video'));
    };

    video.src = videoUrl;
    video.load();
  });
}

/**
 * Get video duration from a file
 * @param file - Video file
 * @returns Promise<number> - Duration in seconds
 */
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(Math.floor(video.duration));
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video'));
    };

    video.src = URL.createObjectURL(file);
  });
}
