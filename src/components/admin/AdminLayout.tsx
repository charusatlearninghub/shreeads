import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import {
  Home, 
  BookOpen, 
  Users, 
  Ticket, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  MessageSquare,
  Tag,
  History,
  Award,
  Package,
  IndianRupee,
  Shield,
  Youtube,
  ChevronDown,
  UserCheck,
  Megaphone,
  X
} from 'lucide-react';
import { AdminNotifications } from './AdminNotifications';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/new-logo.png';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

interface SidebarGroup {
  label: string;
  icon: React.ElementType;
  items: { icon: React.ElementType; label: string; href: string }[];
}

const sidebarGroups: SidebarGroup[] = [
  {
    label: 'Course Management',
    icon: BookOpen,
    items: [
      { icon: BookOpen, label: 'Courses', href: '/admin/courses' },
      { icon: Ticket, label: 'Course Promo Codes', href: '/admin/promo-codes' },
    ],
  },
  {
    label: 'Software Management',
    icon: Package,
    items: [
      { icon: Package, label: 'Software', href: '/admin/software' },
      { icon: Ticket, label: 'Software Promo Codes', href: '/admin/software-promo-codes' },
    ],
  },
  {
    label: 'User Management',
    icon: Users,
    items: [
      { icon: Users, label: 'Users', href: '/admin/users' },
      { icon: UserCheck, label: 'Enrollments', href: '/admin/enrollments' },
      { icon: Award, label: 'Certificates', href: '/admin/certificates' },
      { icon: FileImage, label: 'Certificate Templates', href: '/admin/certificate-templates' },
    ],
  },
  {
    label: 'Marketing',
    icon: Megaphone,
    items: [
      { icon: Tag, label: 'Promotions', href: '/admin/promotions' },
      { icon: MessageSquare, label: 'Reviews', href: '/admin/reviews' },
      { icon: Youtube, label: 'YouTube Videos', href: '/admin/videos' },
    ],
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    items: [
      { icon: IndianRupee, label: 'Revenue', href: '/admin/revenue' },
      { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
      { icon: History, label: 'Price History', href: '/admin/price-history' },
    ],
  },
  {
    label: 'System',
    icon: Settings,
    items: [
      { icon: Shield, label: 'Security Incidents', href: '/admin/security-incidents' },
      { icon: Settings, label: 'Settings', href: '/admin/settings' },
    ],
  },
];

function SidebarGroupItem({ group, location, onNavigate }: { group: SidebarGroup; location: ReturnType<typeof useLocation>; onNavigate: () => void }) {
  const isGroupActive = group.items.some(
    item => location.pathname === item.href || location.pathname.startsWith(item.href + '/')
  );
  const [isOpen, setIsOpen] = useState(isGroupActive);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors",
          isGroupActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span className="flex items-center gap-2">
          <group.icon className="w-4 h-4" />
          {group.label}
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="mt-0.5 ml-3 pl-3 border-l border-border/50 space-y-0.5">
          {group.items.map((item) => {
            const isActive = location.pathname === item.href ||
              location.pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AdminLayout({ children, title, subtitle, actions }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const closeSidebar = () => setIsSidebarOpen(false);
  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'Admin';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-[280px] bg-card border-r border-border z-50 transform transition-transform duration-300 lg:translate-x-0 flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo + Close */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="SHREE ADS" className="h-10 w-auto object-contain" />
          </Link>
          <button onClick={closeSidebar} className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dashboard Link */}
        <div className="px-3 pt-3">
          <Link
            to="/admin"
            onClick={closeSidebar}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              location.pathname === '/admin'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>

        {/* Grouped Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pt-3 pb-20 lg:pb-3 space-y-3">
          {sidebarGroups.map((group) => (
            <SidebarGroupItem key={group.label} group={group} location={location} onNavigate={closeSidebar} />
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-border bg-card p-3 pb-24 md:pb-3 shrink-0 mt-3 flex flex-col gap-2">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            size="sm"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-[280px] min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors shrink-0"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0 flex-1">
                <Breadcrumbs className="mb-1 hidden sm:flex" />
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-lg lg:text-xl font-bold truncate">{title}</h1>
                  {actions && <div className="hidden sm:flex items-center gap-2">{actions}</div>}
                </div>
                {subtitle && (
                  <p className="text-sm text-muted-foreground truncate hidden sm:block mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {actions && <div className="sm:hidden flex items-center gap-2">{actions}</div>}
              <AdminNotifications />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
