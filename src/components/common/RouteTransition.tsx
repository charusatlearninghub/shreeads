import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import logo from "@/assets/new-logo.png";
import { PageSkeleton } from "@/components/common/PageSkeleton";

const STORE_KEY = "route-scroll-positions";

function readStore(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(STORE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, number>) {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* storage unavailable — ignore */
  }
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Route transition handler:
 * - PUSH/REPLACE navigations always start at the top of the page.
 * - POP (browser back/forward) restores the previously saved scroll position.
 * - Shows an accessible, motion-aware logo + skeleton loader during the transition.
 */
export function RouteTransition() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const [isLoading, setIsLoading] = useState(false);
  const firstRender = useRef(true);
  const currentKey = useRef<string>(location.key);

  // Take over scroll restoration from the browser (it restores too late for SPAs).
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      const previous = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
      return () => {
        window.history.scrollRestoration = previous;
      };
    }
  }, []);

  // Continuously record the scroll position for the active history entry.
  useEffect(() => {
    currentKey.current = location.key;
    const save = () => {
      const store = readStore();
      store[currentKey.current] = window.scrollY;
      writeStore(store);
    };
    window.addEventListener("scroll", save, { passive: true });
    window.addEventListener("pagehide", save);
    return () => {
      save();
      window.removeEventListener("scroll", save);
      window.removeEventListener("pagehide", save);
    };
  }, [location.key]);

  // Apply the correct scroll position for the new location.
  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) {
        el.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "start",
        });
        return;
      }
    }

    const target =
      navigationType === "POP" ? readStore()[location.key] ?? 0 : 0;

    // Wait for the new route to paint before restoring, so the page is tall enough.
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: target, left: 0, behavior: "auto" });
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [location.key, location.pathname, location.search, location.hash, navigationType]);

  // Brief loading state between routes.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setIsLoading(true);
    const t = window.setTimeout(
      () => setIsLoading(false),
      prefersReducedMotion() ? 200 : 450
    );
    return () => window.clearTimeout(t);
  }, [location.key]);

  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden bg-background"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading page"
    >
      {/* Section shimmer placeholders */}
      <div className="absolute inset-0 opacity-70">
        <PageSkeleton />
      </div>

      {/* Centered brand loader */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
        <div className="relative flex items-center justify-center">
          <span
            aria-hidden
            className="absolute h-24 w-24 rounded-full border-2 border-primary/20 border-t-primary animate-spin motion-reduce:animate-none"
          />
          <img
            src={logo}
            alt=""
            aria-hidden
            className="h-14 w-auto object-contain animate-pulse motion-reduce:animate-none"
          />
        </div>
      </div>

      <span className="sr-only">Loading page, please wait…</span>
    </div>
  );
}

export default RouteTransition;
