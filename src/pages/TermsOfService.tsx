import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { FileText, Phone, Mail } from "lucide-react";

const TermsOfService = () => {
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
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl lg:text-4xl font-bold mb-3">Terms of Service</h1>
            <p className="text-muted-foreground text-lg">By using our website you agree to these terms.</p>
          </div>

          <div className="space-y-8">
            <Section title="Website Use">
              <p className="text-muted-foreground">Users must use the website legally and responsibly.</p>
            </Section>

            <Section title="Course Access">
              <p className="text-muted-foreground">Course access is provided only to the registered user and should not be shared.</p>
            </Section>

            <Section title="Intellectual Property">
              <p className="text-muted-foreground">All course materials and content belong to ShreeAds and cannot be copied or distributed.</p>
            </Section>

            <Section title="Limitation of Liability">
              <p className="text-muted-foreground">We are not responsible for business results or financial outcomes based on course content.</p>
            </Section>

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

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-border bg-card p-6">
    <h2 className="font-display text-xl font-semibold mb-4">{title}</h2>
    {children}
  </div>
);

export default TermsOfService;
