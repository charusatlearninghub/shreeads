import { forwardRef } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Home,
  BookOpen,
  BadgeCheck,
  UserRound,
  HelpCircle,
  MessagesSquare,
  Headphones,
  Shield,
  FileText,
  RotateCcw,
  AlertTriangle,
  LucideIcon,
} from "lucide-react";

const socialLinks = [
  {
    name: "WhatsApp",
    href: "https://wa.link/hj5t8y",
    icon: MessageCircle,
    hoverColor: "hover:bg-[#25D366]"
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61578842616608",
    icon: () => (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    hoverColor: "hover:bg-[#1877F2]"
  },
  {
    name: "Instagram (Business)",
    href: "https://www.instagram.com/shree_ads_mall",
    icon: () => (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
    hoverColor: "hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888]"
  },
  {
    name: "Instagram (Personal)",
    href: "https://www.instagram.com/mahipal_jinjala_",
    icon: () => (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
    hoverColor: "hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888]"
  }
];

function FooterNavLink({
  to,
  icon: Icon,
  children,
}: {
  to: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-2.5 min-h-[44px] sm:min-h-0 py-2 sm:py-1.5 -mx-1 px-1.5 rounded-lg text-[13px] sm:text-sm text-muted-foreground transition-colors hover:text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <Icon className="h-4 w-4 shrink-0 text-primary/70 transition-colors group-hover:text-primary" aria-hidden />
      <span className="leading-snug">{children}</span>
    </Link>
  );
}

function FooterColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-foreground/90 mb-4 sm:mb-5">
      {children}
    </h4>
  );
}

export const Footer = forwardRef<HTMLElement>((_, ref) => {
  return (
    <footer ref={ref} className="border-t border-border/60 bg-muted/25">
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-14 lg:py-16">
        <div
          className="
          grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5
          gap-0
          divide-y divide-border/50
          sm:divide-y-0 sm:gap-x-8 sm:gap-y-10
          xl:gap-x-0 xl:divide-y-0
        "
        >
          {/* Column 1 – About */}
          <div className="pb-10 pt-2 sm:pb-0 sm:pt-0 xl:pr-8 xl:border-r xl:border-border/50">
            <Link to="/" className="inline-flex items-center gap-3 group mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md shadow-primary/15 group-hover:shadow-primary/25 transition-shadow">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base tracking-tight text-foreground">SHREE ADS</h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground">Digital marketing learning platform</p>
              </div>
            </Link>
            <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed max-w-xs">
              SHREE ADS is a digital marketing learning platform helping you build real skills through courses, tools, and
              practical training.
            </p>
            <div className="flex flex-wrap gap-2 pt-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.name}
                    className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg bg-background/80 border border-border/60 flex items-center justify-center text-muted-foreground ${social.hoverColor} hover:text-white hover:border-transparent transition-all duration-200`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2 – Quick Links */}
          <div className="pb-10 sm:pb-0 xl:px-8 xl:border-r xl:border-border/50">
            <FooterColumnHeading>Quick Links</FooterColumnHeading>
            <nav aria-label="Quick links">
              <ul className="flex flex-col gap-0.5">
                <li>
                  <FooterNavLink to="/" icon={Home}>
                    Home
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink to="/courses" icon={BookOpen}>
                    Courses
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink to="/verify-certificate" icon={BadgeCheck}>
                    Verify Certificate
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink to="/contact" icon={UserRound}>
                    Contact Us
                  </FooterNavLink>
                </li>
              </ul>
            </nav>
          </div>

          {/* Column 3 – Support */}
          <div className="pb-10 sm:pb-0 xl:px-8 xl:border-r xl:border-border/50">
            <FooterColumnHeading>Support</FooterColumnHeading>
            <nav aria-label="Support">
              <ul className="flex flex-col gap-0.5">
                <li>
                  <FooterNavLink to="/help-center" icon={HelpCircle}>
                    Help Center
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink to="/faqs" icon={MessagesSquare}>
                    FAQs
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink to="/contact" icon={Headphones}>
                    Contact Support
                  </FooterNavLink>
                </li>
              </ul>
            </nav>
          </div>

          {/* Column 4 – Legal */}
          <div className="pb-10 sm:pb-0 xl:px-8 xl:border-r xl:border-border/50">
            <FooterColumnHeading>Legal</FooterColumnHeading>
            <nav aria-label="Legal">
              <ul className="flex flex-col gap-0.5">
                <li>
                  <FooterNavLink to="/privacy-policy" icon={Shield}>
                    Privacy Policy
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink to="/terms-of-service" icon={FileText}>
                    Terms of Service
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink to="/refund-policy" icon={RotateCcw}>
                    Refund Policy
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink to="/disclaimer" icon={AlertTriangle}>
                    Disclaimer
                  </FooterNavLink>
                </li>
              </ul>
            </nav>
          </div>

          {/* Column 5 – Contact */}
          <div className="pb-2 sm:pb-0 xl:pl-8">
            <FooterColumnHeading>Contact</FooterColumnHeading>
            <ul className="space-y-4 text-[13px] sm:text-sm">
              <li className="flex gap-3 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden />
                <div>
                  <span className="font-medium text-foreground/85 text-xs uppercase tracking-wide block mb-1">
                    Address
                  </span>
                  <span className="leading-relaxed">Mahuva, Bhavnagar, Gujarat – 364290</span>
                </div>
              </li>
              <li className="flex gap-3">
                <Phone className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden />
                <div>
                  <span className="font-medium text-foreground/85 text-xs uppercase tracking-wide block mb-1">Phone</span>
                  <a
                    href="tel:+919265106657"
                    className="inline-block py-1 -my-1 text-muted-foreground hover:text-primary transition-colors"
                  >
                    +91 9265106657
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <Mail className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden />
                <div className="min-w-0">
                  <span className="font-medium text-foreground/85 text-xs uppercase tracking-wide block mb-1">Email</span>
                  <a
                    href="mailto:shreeadsmall@gmail.com"
                    className="text-muted-foreground hover:text-primary transition-colors break-all"
                  >
                    shreeadsmall@gmail.com
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 sm:mt-14 pt-8 border-t border-border/60">
          <p className="text-center text-muted-foreground text-xs sm:text-sm">© 2024 SHREE ADS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
