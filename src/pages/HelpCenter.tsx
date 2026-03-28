import { DocumentPageLayout } from "@/components/layout/DocumentPageLayout";
import { SeoHead } from "@/components/common/SeoHead";
import { motion } from "framer-motion";
import {
  HelpCircle,
  LogIn,
  BookOpen,
  Play,
  CreditCard,
  Headphones,
  Phone,
  Mail,
  MapPin,
  Rocket,
} from "lucide-react";

const HelpCenter = () => {
  return (
    <DocumentPageLayout>
      <SeoHead
        title="SHREE ADS Help Center – Customer Support"
        description="Get help with login issues, course access, payments, and technical support on the SHREE ADS learning platform."
      />
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
          <div className="text-center mb-10 sm:mb-12">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 px-1">
              SHREE ADS – Help Center
            </h1>
            <div className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed space-y-3 text-center">
              <p>
                Welcome to the ShreeAds Help Center. Our goal is to make your learning experience simple, smooth, and
                successful.
              </p>
              <p>
                If you need assistance with your account, course access, or payments, you can find answers below or
                contact our support team.
              </p>
            </div>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <HelpSection
              icon={<Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />}
              title="Getting Started"
            >
              <p className="text-muted-foreground mb-4">
                After purchasing a course from ShreeAds, you will receive course access through:
              </p>
              <ul className="list-disc list-outside ml-5 sm:ml-6 space-y-2 text-muted-foreground">
                <li>Your registered ShreeAds account dashboard</li>
                <li>A confirmation email with course access details</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                If you do not see the course immediately, please wait a few minutes and refresh the page.
              </p>
            </HelpSection>

            <HelpSection icon={<LogIn className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />} title="Account Login Issues">
              <p className="text-muted-foreground mb-4">If you cannot log into your account, try the following steps:</p>
              <ul className="list-disc list-outside ml-5 sm:ml-6 space-y-2 text-muted-foreground">
                <li>Make sure your email and password are correct</li>
                <li>Use the Forgot Password option to reset your password</li>
                <li>Clear your browser cache and cookies</li>
                <li>Try logging in using a different browser or device</li>
              </ul>
              <p className="text-muted-foreground mt-4">If the issue continues, contact our support team.</p>
            </HelpSection>

            <HelpSection
              icon={<BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />}
              title="Course Access Problems"
            >
              <p className="text-muted-foreground mb-4">If your payment is completed but the course is not accessible:</p>
              <ul className="list-disc list-outside ml-5 sm:ml-6 space-y-2 text-muted-foreground">
                <li>Wait 5–10 minutes and refresh the page</li>
                <li>Check your email inbox and spam folder</li>
                <li>Ensure you are logged in with the same email used during purchase</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                If access is still unavailable, contact support with your payment screenshot or transaction ID.
              </p>
            </HelpSection>

            <HelpSection icon={<Play className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />} title="Video or Technical Issues">
              <p className="text-muted-foreground mb-4">If course videos are not loading properly:</p>
              <ul className="list-disc list-outside ml-5 sm:ml-6 space-y-2 text-muted-foreground">
                <li>Use a modern browser like Google Chrome</li>
                <li>Ensure you have a stable internet connection</li>
                <li>Try accessing the course from another device or browser</li>
                <li>Disable browser extensions if necessary</li>
              </ul>
            </HelpSection>

            <HelpSection
              icon={<CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />}
              title="Payment Support"
            >
              <p className="text-muted-foreground mb-4">
                If your payment failed or money was deducted but the course is not available:
              </p>
              <p className="text-muted-foreground mb-4">Please contact our support team with:</p>
              <ul className="list-disc list-outside ml-5 sm:ml-6 space-y-2 text-muted-foreground">
                <li>Payment screenshot</li>
                <li>Transaction ID</li>
                <li>Email used during purchase</li>
              </ul>
              <p className="text-muted-foreground mt-4">Our team will verify and resolve the issue quickly.</p>
            </HelpSection>

            <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-5">
                <Headphones className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <h2 className="font-display text-lg sm:text-xl font-semibold">Contact Support</h2>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base mb-6 leading-relaxed">
                If you still need help, reach out to us:
              </p>
              <div className="space-y-4">
                <a
                  href="tel:+919265106657"
                  className="flex items-start gap-3 text-muted-foreground hover:text-primary transition-colors text-sm sm:text-base"
                >
                  <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>Phone / WhatsApp: +91 9265106657</span>
                </a>
                <a
                  href="mailto:shreeadsmall@gmail.com"
                  className="flex items-start gap-3 text-muted-foreground hover:text-primary transition-colors text-sm sm:text-base"
                >
                  <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>Email: shreeadsmall@gmail.com</span>
                </a>
                <div className="flex items-start gap-3 text-muted-foreground text-sm sm:text-base">
                  <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>
                    Address
                    <br />
                    Mahuva, Bhavnagar
                    <br />
                    Gujarat, 364290, India
                  </span>
                </div>
              </div>
            </div>
          </div>
      </motion.div>
    </DocumentPageLayout>
  );
};

const HelpSection = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
    <div className="flex items-start gap-3 sm:gap-4 mb-4">
      <span className="mt-0.5">{icon}</span>
      <h2 className="font-display text-lg sm:text-xl font-semibold leading-snug pt-0.5">{title}</h2>
    </div>
    <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-p:mb-0">{children}</div>
  </section>
);

export default HelpCenter;
