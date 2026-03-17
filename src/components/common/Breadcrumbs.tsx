import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const routeMap: Record<string, { label: string; parent?: string }> = {
  '/admin': { label: 'Dashboard' },
  '/admin/courses': { label: 'Courses', parent: '/admin' },
  '/admin/software': { label: 'Software', parent: '/admin' },
  '/admin/users': { label: 'Users', parent: '/admin' },
  '/admin/promo-codes': { label: 'Course Promo Codes', parent: '/admin' },
  '/admin/software-promo-codes': { label: 'Software Promo Codes', parent: '/admin' },
  '/admin/promotions': { label: 'Promotions', parent: '/admin' },
  '/admin/price-history': { label: 'Price History', parent: '/admin' },
  '/admin/reviews': { label: 'Reviews', parent: '/admin' },
  '/admin/enrollments': { label: 'Enrollments', parent: '/admin' },
  '/admin/certificates': { label: 'Certificates', parent: '/admin' },
  '/admin/revenue': { label: 'Revenue', parent: '/admin' },
  '/admin/analytics': { label: 'Analytics', parent: '/admin' },
  '/admin/security-incidents': { label: 'Security Incidents', parent: '/admin' },
  '/admin/videos': { label: 'YouTube Videos', parent: '/admin' },
  '/admin/settings': { label: 'Settings', parent: '/admin' },
  '/dashboard': { label: 'Dashboard' },
  '/dashboard/courses': { label: 'My Courses', parent: '/dashboard' },
  '/dashboard/software': { label: 'My Software', parent: '/dashboard' },
  '/dashboard/certificates': { label: 'Certificates', parent: '/dashboard' },
  '/dashboard/referrals': { label: 'Referrals', parent: '/dashboard' },
  '/dashboard/settings': { label: 'Settings', parent: '/dashboard' },
};

function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];
  const route = routeMap[pathname];
  
  if (!route) return items;

  // Build chain from parent to current
  const chain: { label: string; href: string }[] = [];
  let current: string | undefined = pathname;
  
  while (current && routeMap[current]) {
    chain.unshift({ label: routeMap[current].label, href: current });
    current = routeMap[current].parent;
  }

  return chain.map((item, index) => ({
    label: item.label,
    href: index < chain.length - 1 ? item.href : undefined,
  }));
}

export function Breadcrumbs({ className }: { className?: string }) {
  const location = useLocation();
  const items = buildBreadcrumbs(location.pathname);

  if (items.length <= 1) return null;

  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <nav className={cn("flex items-center gap-1 text-sm", className)} aria-label="Breadcrumb">
      <Link
        to={isAdmin ? '/admin' : '/dashboard'}
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          {item.href ? (
            <Link
              to={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[120px] sm:max-w-none"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium truncate max-w-[150px] sm:max-w-none">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
