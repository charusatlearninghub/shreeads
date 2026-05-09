import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobileBottomBarProps {
  /** Left-side content, typically a price block. */
  left: ReactNode;
  /** Right-side content, typically the primary CTA(s). */
  right: ReactNode;
  className?: string;
  /** Hide on screens >= md. Default true. */
  mobileOnly?: boolean;
}

/**
 * Sticky bottom bar that converts the desktop sticky pricing card into
 * a compact purchase bar on mobile. Sits above the global mobile bottom
 * nav by using bottom-16 with safe-area inset support.
 */
export function MobileBottomBar({
  left,
  right,
  className,
  mobileOnly = true,
}: MobileBottomBarProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 z-40 border-t bg-background/95 backdrop-blur-md shadow-[0_-4px_16px_rgba(0,0,0,0.06)]",
        // Sit above the user/admin mobile bottom nav (h-16)
        "bottom-16",
        "px-4 py-3",
        mobileOnly && "md:hidden",
        className
      )}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center justify-between gap-3 max-w-3xl mx-auto">
        <div className="min-w-0 flex-1">{left}</div>
        <div className="shrink-0">{right}</div>
      </div>
    </div>
  );
}
