import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import logo from "@/assets/new-logo.png";

/**
 * Resets scroll to top on every route change and shows a brief
 * branded loader overlay during the transition.
 */
export function RouteTransition() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const [isLoading, setIsLoading] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    // Disable browser scroll restoration so pages never open scrolled down.
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    // Always start at the top (unless navigating to an in-page anchor).
    if (location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setIsLoading(true);
    const t = window.setTimeout(() => setIsLoading(false), 450);
    return () => window.clearTimeout(t);
  }, [location.pathname, navigationType]);

  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/90 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="relative flex items-center justify-center">
        <span className="absolute h-24 w-24 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <img
          src={logo}
          alt="SHREE ADS"
          className="h-14 w-auto object-contain animate-pulse"
        />
      </div>
    </div>
  );
}

export default RouteTransition;
