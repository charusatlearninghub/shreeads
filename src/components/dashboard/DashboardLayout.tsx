import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import {
  BookOpen,
  Award,
  Settings,
  LogOut,
  Home,
  Folder,
  Share2,
  Bell,
  Package,
  PackageOpen,
  ChevronDown } from
"lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { PromotionalBanner } from "@/components/promotions/PromotionalBanner";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/new-logo.png";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

interface SidebarGroup {
  label: string;
  items: {icon: React.ElementType;label: string;href: string;}[];
}

const sidebarGroups: SidebarGroup[] = [
{
  label: 'Learning',
  items: [
  { icon: BookOpen, label: "My Courses", href: "/dashboard/courses" },
  { icon: Package, label: "My Software", href: "/dashboard/software" },
  { icon: Folder, label: "Browse Courses", href: "/courses" },
  { icon: PackageOpen, label: "Browse Software", href: "/software" }]

},
{
  label: 'Achievements',
  items: [
  { icon: Award, label: "Certificates", href: "/dashboard/certificates" }]

},
{
  label: 'Community',
  items: [
  { icon: Share2, label: "Referrals", href: "/dashboard/referrals" }]

},
{
  label: 'Account',
  items: [
  { icon: Settings, label: "Settings", href: "/dashboard/settings" }]

}];

function SidebarGroupSection({ group, location, onNavigate }: {group: SidebarGroup;location: ReturnType<typeof useLocation>;onNavigate: () => void;}) {
  const isGroupActive = group.items.some(
    (item) => location.pathname === item.href
  );
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
          isGroupActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}>
        
        {group.label}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>
      {isOpen &&
      <div className="space-y-0.5">
          {group.items.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive ?
                "bg-primary text-primary-foreground shadow-sm" :
                "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}>
              
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>);

        })}
        </div>
      }
    </div>);

}

export const DashboardLayout = ({ children, title, subtitle }: DashboardLayoutProps) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-[280px] bg-card border-r border-border z-50 hidden md:flex flex-col">
        {/* Logo + Close */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <Link to="/" className="flex items-center px-0 my-0 text-center mx-[50px] text-base border-0">
            <img alt="SHREE ADS" className="h-10 w-auto object-fill" src={logo} />
          </Link>
        </div>

        {/* Dashboard Link */}
        <div className="px-3 pt-3">
          <Link
            to="/dashboard"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              location.pathname === '/dashboard' ?
              "bg-primary text-primary-foreground shadow-sm" :
              "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}>
            
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>

        {/* Grouped Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {sidebarGroups.map((group) =>
          <SidebarGroupSection key={group.label} group={group} location={location} onNavigate={() => {}} />
          )}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-border shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
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
            onClick={handleSignOut}>
            
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="md:ml-[280px]">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="min-w-0 flex-1">
                <Breadcrumbs className="mb-1 hidden sm:flex" />
                <h1 className="text-lg lg:text-xl font-bold truncate">{title}</h1>
                {subtitle && <p className="text-sm text-muted-foreground truncate hidden sm:block mt-0.5">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggle />
              <button className="p-2 rounded-lg hover:bg-muted transition-colors relative">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </header>

        {/* Promotional Banner */}
        <PromotionalBanner variant="compact" className="sticky z-20" />

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>);

};