import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  DollarSign,
  LayoutDashboard,
  Megaphone,
  Package,
  Star,
  Ticket,
  Users,
  Award,
  History,
  Youtube,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DropdownKey = "courses" | "software" | "users" | "marketing" | "analytics" | null;

export default function MobileBottomNavAdmin() {
  const location = useLocation();
  const [open, setOpen] = useState<DropdownKey>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOpen(null);
  }, [location.pathname]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setOpen(null);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const isActive = (href: string) => location.pathname === href;

  const baseBtn =
    "min-h-11 flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-colors";
  const activeBtn = "text-primary";
  const inactiveBtn = "text-muted-foreground hover:text-foreground";

  const dropdownBase =
    "absolute bottom-full mb-2 left-1/2 -translate-x-1/2 mx-2 bg-white !opacity-100 shadow-xl border border-gray-200 rounded-2xl p-2 w-36 sm:w-40 md:w-44 max-w-[160px] sm:max-w-[180px] z-[999] flex flex-col gap-1";
  const dropdownItem =
    "w-full text-left px-2 py-2 rounded-lg text-sm sm:text-base text-gray-900 font-medium hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center gap-2";

  const toggle = (key: DropdownKey) => setOpen((prev) => (prev === key ? null : key));

  return (
    <div
      ref={rootRef}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card md:hidden h-16"
    >
      <div className="mx-auto h-full w-full max-w-2xl px-2 pb-[calc(env(safe-area-inset-bottom,0px)+6px)] overflow-visible">
        <div className="grid h-full grid-cols-6 gap-1 items-center overflow-visible">
          <Link
            to="/admin"
            className={cn(baseBtn, isActive("/admin") ? activeBtn : inactiveBtn)}
            aria-label="Admin Dashboard"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[11px] font-medium">Dashboard</span>
          </Link>

          <div className="relative isolate z-[999] flex flex-col items-center overflow-visible">
            <button
              type="button"
              onClick={() => toggle("courses")}
              className={cn(
                baseBtn,
                open === "courses" || location.pathname.startsWith("/admin/courses") || location.pathname === "/admin/promo-codes"
                  ? activeBtn
                  : inactiveBtn,
                "w-full"
              )}
              aria-label="Course Management"
              aria-expanded={open === "courses"}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-[11px] font-medium flex items-center gap-1">
                Courses
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open === "courses" && "rotate-180")} />
              </span>
            </button>

            {open === "courses" && (
              <div className={dropdownBase} role="menu">
                <Link to="/admin/courses" className={dropdownItem} role="menuitem">
                  <BookOpen className="w-4 h-4" />
                  Courses
                </Link>
                <Link to="/admin/promo-codes" className={dropdownItem} role="menuitem">
                  <Ticket className="w-4 h-4" />
                  Promo Codes
                </Link>
              </div>
            )}
          </div>

          <div className="relative isolate z-[999] flex flex-col items-center overflow-visible">
            <button
              type="button"
              onClick={() => toggle("software")}
              className={cn(
                baseBtn,
                open === "software" ||
                  location.pathname === "/admin/software" ||
                  location.pathname === "/admin/software-promo-codes"
                  ? activeBtn
                  : inactiveBtn,
                "w-full"
              )}
              aria-label="Software Management"
              aria-expanded={open === "software"}
            >
              <Package className="w-5 h-5" />
              <span className="text-[11px] font-medium flex items-center gap-1">
                Software
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open === "software" && "rotate-180")} />
              </span>
            </button>

            {open === "software" && (
              <div className={dropdownBase} role="menu">
                <Link to="/admin/software" className={dropdownItem} role="menuitem">
                  <Package className="w-4 h-4" />
                  Software
                </Link>
                <Link to="/admin/software-promo-codes" className={dropdownItem} role="menuitem">
                  <Ticket className="w-4 h-4" />
                  Promo Codes
                </Link>
              </div>
            )}
          </div>

          <div className="relative isolate z-[999] flex flex-col items-center overflow-visible">
            <button
              type="button"
              onClick={() => toggle("users")}
              className={cn(
                baseBtn,
                open === "users" ||
                  location.pathname === "/admin/users" ||
                  location.pathname === "/admin/enrollments" ||
                  location.pathname === "/admin/certificates"
                  ? activeBtn
                  : inactiveBtn,
                "w-full"
              )}
              aria-label="User Management"
              aria-expanded={open === "users"}
            >
              <Users className="w-5 h-5" />
              <span className="text-[11px] font-medium flex items-center gap-1">
                Users
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open === "users" && "rotate-180")} />
              </span>
            </button>

            {open === "users" && (
              <div className={dropdownBase} role="menu">
                <Link to="/admin/users" className={dropdownItem} role="menuitem">
                  <Users className="w-4 h-4" />
                  Users
                </Link>
                <Link to="/admin/enrollments" className={dropdownItem} role="menuitem">
                  <BookOpen className="w-4 h-4" />
                  Enrollments
                </Link>
                <Link to="/admin/certificates" className={dropdownItem} role="menuitem">
                  <Award className="w-4 h-4" />
                  Certificates
                </Link>
              </div>
            )}
          </div>

          <div className="relative isolate z-[999] flex flex-col items-center overflow-visible">
            <button
              type="button"
              onClick={() => toggle("marketing")}
              className={cn(
                baseBtn,
                open === "marketing" ||
                  location.pathname === "/admin/promotions" ||
                  location.pathname === "/admin/reviews" ||
                  location.pathname === "/admin/videos"
                  ? activeBtn
                  : inactiveBtn,
                "w-full"
              )}
              aria-label="Marketing"
              aria-expanded={open === "marketing"}
            >
              <Megaphone className="w-5 h-5" />
              <span className="text-[11px] font-medium flex items-center gap-1">
                Marketing
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open === "marketing" && "rotate-180")} />
              </span>
            </button>

            {open === "marketing" && (
              <div className={dropdownBase} role="menu">
                <Link to="/admin/promotions" className={dropdownItem} role="menuitem">
                  <Megaphone className="w-4 h-4" />
                  Promotions
                </Link>
                <Link to="/admin/reviews" className={dropdownItem} role="menuitem">
                  <Star className="w-4 h-4" />
                  Reviews
                </Link>
                <Link to="/admin/videos" className={dropdownItem} role="menuitem">
                  <Youtube className="w-4 h-4" />
                  Videos
                </Link>
              </div>
            )}
          </div>

          <div className="relative isolate z-[999] flex flex-col items-center overflow-visible">
            <button
              type="button"
              onClick={() => toggle("analytics")}
              className={cn(
                baseBtn,
                open === "analytics" ||
                  location.pathname === "/admin/revenue" ||
                  location.pathname === "/admin/analytics" ||
                  location.pathname === "/admin/price-history"
                  ? activeBtn
                  : inactiveBtn,
                "w-full"
              )}
              aria-label="Analytics"
              aria-expanded={open === "analytics"}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-[11px] font-medium flex items-center gap-1">
                Analytics
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open === "analytics" && "rotate-180")} />
              </span>
            </button>

            {open === "analytics" && (
              <div className={dropdownBase} role="menu">
                <Link to="/admin/revenue" className={dropdownItem} role="menuitem">
                  <DollarSign className="w-4 h-4" />
                  Revenue
                </Link>
                <Link to="/admin/analytics" className={dropdownItem} role="menuitem">
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </Link>
                <Link to="/admin/price-history" className={dropdownItem} role="menuitem">
                  <History className="w-4 h-4" />
                  Price History
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

