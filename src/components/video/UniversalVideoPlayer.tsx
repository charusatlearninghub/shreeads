import { useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { getPlayableUrl } from "@/lib/video-sources";

type Props = {
  url: string | null | undefined;
  title?: string;
  className?: string;
};

export function UniversalVideoPlayer({ url, title, className }: Props) {
  const { type, playableUrl } = useMemo(() => getPlayableUrl(url), [url]);

  if (!url || !url.trim()) {
    return (
      <div className={className}>
        <div className="w-full aspect-video rounded-lg bg-secondary flex items-center justify-center text-muted-foreground text-sm">
          No video URL
        </div>
      </div>
    );
  }

  if (!playableUrl) {
    return (
      <div className={className}>
        <div className="w-full aspect-video rounded-lg bg-secondary flex items-center justify-center p-4 text-center">
          <div className="text-muted-foreground text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Unsupported video format
          </div>
        </div>
      </div>
    );
  }

  if (type === "mp4") {
    return (
      <div className={className}>
        <video
          className="w-full aspect-video rounded-lg bg-black"
          controls
          playsInline
          preload="metadata"
          src={playableUrl}
        />
      </div>
    );
  }

  const iframeClass =
    type === "instagram"
      ? "w-full rounded-lg h-[500px] sm:h-[560px] bg-black"
      : "w-full aspect-video rounded-lg bg-black";

  return (
    <div className={className}>
      <iframe
        src={playableUrl}
        className={iframeClass}
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        title={title || "Video"}
      />
    </div>
  );
}

