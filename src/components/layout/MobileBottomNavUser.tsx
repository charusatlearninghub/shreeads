import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Award,
  BookOpen,
  ChevronDown,
  Compass,
  Folder,
  Home,
  LayoutDashboard,
  Package,
  PackageOpen,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileBottomNavUser() {
  const location = useLocation();
  const [myOpen, setMyOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMyOpen(false);
    setBrowseOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setMyOpen(false);
      setBrowseOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const isActive = (href: string) =>
    location.pathname === href || (href === "/dashboard" && location.pathname === "/dashboard");

  const baseBtn =
    "min-h-11 flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-colors";
  const activeBtn = "text-primary";
  const inactiveBtn = "text-muted-foreground hover:text-foreground";

  const dropdownBase =
    "absolute bottom-full mb-2 left-1/2 -translate-x-1/2 mx-2 bg-white !opacity-100 shadow-xl border border-gray-200 rounded-2xl p-2 w-36 sm:w-40 md:w-44 max-w-[160px] sm:max-w-[180px] z-[999] flex flex-col gap-1";
  const dropdownItem =
    "w-full text-left px-2 py-2 rounded-lg text-sm sm:text-base text-gray-900 font-medium hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center gap-2";

  return (
    <div
      ref={rootRef}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card md:hidden h-16"
    >
      <div className="mx-auto h-full w-full max-w-2xl px-2 pb-[calc(env(safe-area-inset-bottom,0px)+6px)] overflow-visible">
        <div className="grid h-full grid-cols-6 gap-1 items-center overflow-visible">
          <Link to="/" className={cn(baseBtn, isActive("/") ? activeBtn : inactiveBtn)} aria-label="Home">
            <Home className="w-5 h-5" />
            <span className="text-[11px] font-medium">Home</span>
          </Link>

          <Link
            to="/dashboard"
            className={cn(baseBtn, isActive("/dashboard") ? activeBtn : inactiveBtn)}
            aria-label="Dashboard"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[11px] font-medium">Dashboard</span>
          </Link>

          <div className="relative isolate z-[999] flex flex-col items-center overflow-visible">
            <button
              type="button"
              onClick={() => {
                setMyOpen((v) => !v);
                setBrowseOpen(false);
              }}
              className={cn(
                baseBtn,
                myOpen ||
                  location.pathname === "/dashboard/courses" ||
                  location.pathname === "/dashboard/software"
                  ? activeBtn
                  : inactiveBtn,
                "w-full"
              )}
              aria-label="My"
              aria-expanded={myOpen}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-[11px] font-medium flex items-center gap-1">
                My
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", myOpen && "rotate-180")} />
              </span>
            </button>

            {myOpen && (
              <div className={dropdownBase} role="menu">
                <Link to="/dashboard/courses" className={dropdownItem} role="menuitem">
                  <BookOpen className="w-4 h-4" />
                  My Courses
                </Link>
                <Link to="/dashboard/software" className={dropdownItem} role="menuitem">
                  <Package className="w-4 h-4" />
                  My Software
                </Link>
              </div>
            )}
          </div>

          <div className="relative isolate z-[999] flex flex-col items-center overflow-visible">
            <button
              type="button"
              onClick={() => {
                setBrowseOpen((v) => !v);
                setMyOpen(false);
              }}
              className={cn(
                baseBtn,
                browseOpen || location.pathname === "/courses" || location.pathname === "/software"
                  ? activeBtn
                  : inactiveBtn,
                "w-full"
              )}
              aria-label="Browse"
              aria-expanded={browseOpen}
            >
              <Compass className="w-5 h-5" />
              <span className="text-[11px] font-medium flex items-center gap-1">
                Browse
                <ChevronDown
                  className={cn("w-3.5 h-3.5 transition-transform", browseOpen && "rotate-180")}
                />
              </span>
            </button>

            {browseOpen && (
              <div className={dropdownBase} role="menu">
                <Link to="/courses" className={dropdownItem} role="menuitem">
                  <Folder className="w-4 h-4" />
                  Courses
                </Link>
                <Link to="/software" className={dropdownItem} role="menuitem">
                  <PackageOpen className="w-4 h-4" />
                  Software
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/dashboard/certificates"
            className={cn(baseBtn, isActive("/dashboard/certificates") ? activeBtn : inactiveBtn)}
            aria-label="Certificates"
          >
            <Award className="w-5 h-5" />
            <span className="text-[11px] font-medium">Certificates</span>
          </Link>

          <Link
            to="/dashboard/settings"
            className={cn(baseBtn, isActive("/dashboard/settings") ? activeBtn : inactiveBtn)}
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[11px] font-medium">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

