import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, UserPlus, LayoutDashboard, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/new-logo.png";
const navLinks = [{
  name: "Home",
  href: "/"
}, {
  name: "Courses",
  href: "/courses"
}, {
  name: "Software",
  href: "/software"
}, {
  name: "Videos",
  href: "/videos"
}, {
  name: "About",
  href: "/about"
}, {
  name: "Contact",
  href: "/contact"
}];
export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    profile,
    isAdmin,
    signOut,
    isLoading
  } = useAuth();
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsOpen(false);
  };
  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'User';
  const initials = displayName.charAt(0).toUpperCase();
  return <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img alt="SHREE ADS" className="h-14 sm:h-16 lg:h-20 w-auto object-contain" src={logo} />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => <Link key={link.name} to={link.href} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${location.pathname === link.href ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                {link.name}
              </Link>)}
          </nav>

          {/* Auth Buttons - Desktop */}
           <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
             {isLoading ? <div className="w-8 h-8 rounded-full bg-secondary animate-pulse" /> : user ? <>
                {isAdmin && <Button variant="outline" size="sm" asChild>
                    <Link to="/admin">
                      <Shield className="w-4 h-4" />
                      Admin
                    </Link>
                  </Button>}
                <Button variant="ghost" asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                </Button>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {initials}
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </> : <>
                <Button variant="ghost" asChild>
                  <Link to="/login">
                    <LogIn className="w-4 h-4" />
                    Login
                  </Link>
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/register">
                    <UserPlus className="w-4 h-4" />
                    Get Started
                  </Link>
                </Button>
              </>}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            {!isLoading && !user && (
              <Button
                size="sm"
                variant="default"
                className="h-9 px-3 rounded-lg"
                asChild
              >
                <Link to="/login">
                  Login
                </Link>
              </Button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && <motion.div initial={{
        opacity: 0,
        height: 0
      }} animate={{
        opacity: 1,
        height: "auto"
      }} exit={{
        opacity: 0,
        height: 0
      }} className="lg:hidden bg-card border-t border-border/50">
            <nav className="container mx-auto px-4 py-4 space-y-2">
              {navLinks.map((link) => <Link key={link.name} to={link.href} onClick={() => setIsOpen(false)} className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${location.pathname === link.href ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                  {link.name}
                </Link>)}
              <div className="pt-4 border-t border-border/50 space-y-2">
                {isLoading ? <div className="w-full h-10 bg-secondary animate-pulse rounded-lg" /> : user ? <>
                    {isAdmin && <Button variant="outline" className="w-full" asChild>
                        <Link to="/admin" onClick={() => setIsOpen(false)}>
                          <Shield className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      </Button>}
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  </> : <>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/login" onClick={() => setIsOpen(false)}>
                        <LogIn className="w-4 h-4" />
                        Login
                      </Link>
                    </Button>
                    <Button variant="hero" className="w-full" asChild>
                      <Link to="/register" onClick={() => setIsOpen(false)}>
                        <UserPlus className="w-4 h-4" />
                        Get Started
                      </Link>
                    </Button>
                  </>}
              </div>
            </nav>
          </motion.div>}
      </AnimatePresence>
    </header>;
};