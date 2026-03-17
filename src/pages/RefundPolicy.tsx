import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { RotateCcw, Phone, Mail } from "lucide-react";

const RefundPolicy = () => {
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
              <RotateCcw className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl lg:text-4xl font-bold mb-3">Refund Policy</h1>
            <p className="text-muted-foreground text-lg">We aim to provide quality training and customer satisfaction.</p>
          </div>

          <div className="space-y-8">
            <Section title="Refund Eligibility">
              <p className="text-muted-foreground">
                Refund requests may be accepted within 3 days of purchase if the course has not been significantly accessed.
              </p>
            </Section>

            <Section title="Non Refundable Cases">
              <p className="text-muted-foreground mb-3">Refunds may not be granted if:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Course has been fully accessed</li>
                <li>Request is made after the refund period</li>
                <li>The purchase was made under promotional offers</li>
              </ul>
            </Section>

            <Section title="Refund Process">
              <p className="text-muted-foreground mb-3">To request a refund:</p>
              <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                <li>Contact support</li>
                <li>Provide payment details</li>
                <li>Explain the reason for refund</li>
              </ol>
            </Section>

            <Section title="Processing Time">
              <p className="text-muted-foreground">
                Approved refunds will be processed within 7–10 business days.
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

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-border bg-card p-6">
    <h2 className="font-display text-xl font-semibold mb-4">{title}</h2>
    {children}
  </div>
);

export default RefundPolicy;
