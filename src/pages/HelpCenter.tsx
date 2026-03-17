import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/common/SeoHead";
import { motion } from "framer-motion";
import { HelpCircle, LogIn, BookOpen, Monitor, CreditCard, Phone, Mail } from "lucide-react";

const HelpCenter = () => {
  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="Help Center & FAQs | ShreeAds"
        description="Get help with your ShreeAds account, courses, and software. Find FAQs, contact support, and resolve account or payment issues quickly."
      />
      <Header />
      <main className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl lg:text-4xl font-bold mb-3">Help Center</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Welcome to the ShreeAds Help Center. Our goal is to make your learning experience smooth and easy. If you need assistance, you can find answers here or contact our support team.
            </p>
          </div>

          <div className="space-y-8">
            <Section icon={<BookOpen className="w-5 h-5 text-primary" />} title="Getting Started">
              <p className="text-muted-foreground">
                After purchasing a course from ShreeAds, you will receive access to the course through your registered account or email instructions.
              </p>
            </Section>

            <Section icon={<LogIn className="w-5 h-5 text-primary" />} title="Account Issues">
              <p className="text-muted-foreground mb-3">If you cannot log into your account:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Check if your email and password are correct</li>
                <li>Try resetting your password</li>
                <li>Clear browser cache and try again</li>
              </ul>
            </Section>

            <Section icon={<BookOpen className="w-5 h-5 text-primary" />} title="Course Access Problems">
              <p className="text-muted-foreground mb-3">If payment is completed but you cannot access the course:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Wait a few minutes and refresh the page</li>
                <li>Check your email for course access instructions</li>
                <li>Contact support with payment proof if access is not available</li>
              </ul>
            </Section>

            <Section icon={<Monitor className="w-5 h-5 text-primary" />} title="Technical Issues">
              <p className="text-muted-foreground mb-3">If videos are not loading:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Use a modern browser like Chrome</li>
                <li>Check your internet connection</li>
                <li>Try another device</li>
              </ul>
            </Section>

            <Section icon={<CreditCard className="w-5 h-5 text-primary" />} title="Payment Support">
              <p className="text-muted-foreground">
                If payment failed or money was deducted but course access is missing, contact support.
              </p>
            </Section>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold mb-4">Contact Support</h2>
              <div className="space-y-3">
                <a href="tel:+919265106657" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="w-5 h-5 text-primary" />
                  <span>Phone / WhatsApp: +91 9265106657</span>
                </a>
                <a href="mailto:shreeadsmall@gmail.com" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="w-5 h-5 text-primary" />
                  <span>Email: shreeadsmall@gmail.com</span>
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-border bg-card p-6">
    <div className="flex items-center gap-3 mb-4">
      {icon}
      <h2 className="font-display text-xl font-semibold">{title}</h2>
    </div>
    {children}
  </div>
);

export default HelpCenter;
