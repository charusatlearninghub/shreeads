import { getYouTubeVideoId } from "@/lib/youtube";

export type VideoType = "youtube" | "mp4" | "drive" | "vimeo" | "instagram" | "unknown";

export function getVideoType(url: string | null | undefined): VideoType {
  if (!url) return "unknown";
  const u = url.trim().toLowerCase();
  if (!u) return "unknown";

  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("drive.google.com")) return "drive";
  if (u.includes("vimeo.com")) return "vimeo";
  if (u.includes("instagram.com/reel")) return "instagram";
  if (/\.mp4(\?|#|$)/i.test(u)) return "mp4";

  return "unknown";
}

export function normalizeUrl(url: string): string {
  return url.trim();
}

export function getGoogleDrivePreviewUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // /file/d/<id>/view
    const match = u.pathname.match(/\/file\/d\/([^/]+)\//);
    const fileId = match?.[1] || u.searchParams.get("id");
    if (!fileId) return null;
    return `https://drive.google.com/file/d/${fileId}/preview`;
  } catch {
    return null;
  }
}

export function getVimeoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    // supports /123456789 or /channels/.../123456789
    const id = parts.reverse().find((p) => /^\d+$/.test(p));
    if (!id) return null;
    return `https://player.vimeo.com/video/${id}`;
  } catch {
    return null;
  }
}

export function getInstagramEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/reel\/([^/]+)/);
    const code = match?.[1];
    if (!code) return null;
    return `https://www.instagram.com/reel/${code}/embed`;
  } catch {
    return null;
  }
}

export function getYouTubeEmbedUrlFromAny(url: string): string | null {
  const id = getYouTubeVideoId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
}

/**
 * Returns the best "playable" URL for the given input.
 * - iframe sources return embed/preview URLs
 * - mp4 returns original URL (for <video>)
 */
export function getPlayableUrl(url: string | null | undefined): { type: VideoType; playableUrl: string | null } {
  if (!url) return { type: "unknown", playableUrl: null };
  const normalized = normalizeUrl(url);
  const type = getVideoType(normalized);

  switch (type) {
    case "youtube":
      return { type, playableUrl: getYouTubeEmbedUrlFromAny(normalized) };
    case "drive":
      return { type, playableUrl: getGoogleDrivePreviewUrl(normalized) };
    case "vimeo":
      return { type, playableUrl: getVimeoEmbedUrl(normalized) };
    case "instagram":
      return { type, playableUrl: getInstagramEmbedUrl(normalized) };
    case "mp4":
      return { type, playableUrl: normalized };
    default:
      return { type: "unknown", playableUrl: null };
  }
}

/**
 * Table `youtube_videos` currently requires a `video_id` string.
 * We store a stable identifier derived from the URL (or the URL itself).
 */
export function getVideoIdentifier(url: string): string {
  const normalized = normalizeUrl(url);
  const type = getVideoType(normalized);

  if (type === "youtube") return getYouTubeVideoId(normalized) || normalized;
  if (type === "drive") return getGoogleDrivePreviewUrl(normalized) || normalized;
  if (type === "vimeo") return getVimeoEmbedUrl(normalized) || normalized;
  if (type === "instagram") return getInstagramEmbedUrl(normalized) || normalized;
  return normalized;
}

