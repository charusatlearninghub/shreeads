import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Shield, Phone, Mail } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl lg:text-4xl font-bold mb-3">Privacy Policy</h1>
            <p className="text-muted-foreground text-lg">
              ShreeAds respects your privacy and is committed to protecting your personal information.
            </p>
          </div>

          <div className="space-y-8">
            <PolicySection title="Information We Collect">
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Name</li>
                <li>Email address</li>
                <li>Payment information</li>
                <li>Website usage data</li>
              </ul>
            </PolicySection>

            <PolicySection title="How We Use Information">
              <p className="text-muted-foreground mb-3">We use collected information to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Provide course access</li>
                <li>Process payments</li>
                <li>Improve services</li>
                <li>Send important updates</li>
              </ul>
            </PolicySection>

            <PolicySection title="Cookies">
              <p className="text-muted-foreground">
                Our website may use cookies to improve user experience and analyze traffic.
              </p>
            </PolicySection>

            <PolicySection title="Third Party Services">
              <p className="text-muted-foreground">
                We may use trusted third-party services such as payment gateways and analytics tools.
              </p>
            </PolicySection>

            <PolicySection title="Data Security">
              <p className="text-muted-foreground">
                We take appropriate measures to protect your information.
              </p>
            </PolicySection>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold mb-4">Contact</h2>
              <div className="space-y-3">
                <a href="tel:+919265106657" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="w-5 h-5 text-primary" />
                  <span>Phone: +91 9265106657</span>
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

const PolicySection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-border bg-card p-6">
    <h2 className="font-display text-xl font-semibold mb-4">{title}</h2>
    {children}
  </div>
);

export default PrivacyPolicy;
