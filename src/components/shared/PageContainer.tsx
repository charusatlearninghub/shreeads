import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  /** Adds the standard pt-24/28/32 top padding for fixed header. Default true. */
  withTopPadding?: boolean;
  /** Adds bottom padding so content clears the mobile bottom nav / sticky bar. */
  withBottomPadding?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeMap = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
};

/**
 * Standard page wrapper providing consistent horizontal padding,
 * top clearance for the fixed header, and bottom clearance for
 * the mobile bottom navigation. Use on every public/dashboard page.
 */
export function PageContainer({
  children,
  className,
  withTopPadding = true,
  withBottomPadding = true,
  size = "xl",
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "container mx-auto px-4 sm:px-6 lg:px-8",
        sizeMap[size],
        withTopPadding && "pt-24 sm:pt-28 lg:pt-32",
        withBottomPadding && "pb-24 md:pb-16",
        className
      )}
    >
      {children}
    </div>
  );
}
