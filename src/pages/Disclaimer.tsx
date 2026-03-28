import { LegalDocumentLayout } from "@/components/layout/LegalDocumentLayout";
import { SeoHead } from "@/components/common/SeoHead";
import { motion } from "framer-motion";
import { AlertTriangle, Phone, Mail } from "lucide-react";

const Disclaimer = () => {
  return (
    <LegalDocumentLayout pageId="disclaimer">
      <SeoHead
        title="SHREE ADS Disclaimer – Digital Marketing Course Platform"
        description="Read the official disclaimer for SHREE ADS covering educational use, third-party platforms, and financial risk information."
      />
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
          <div className="text-center mb-10 sm:mb-12">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 px-1">
              SHREE ADS – Disclaimer
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              This disclaimer applies to the entire SHREE ADS platform—including all courses, training materials,
              tutorials, marketing strategies, tools, and resources—and to everything you access through our website
              and related services.
            </p>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <DisclaimerSection title="Educational Purpose Only">
              <p>
                SHREE ADS provides courses and educational content for informational and learning purposes only. Nothing
                on this website, in our courses, or in any training materials, tutorials, or resources constitutes legal,
                financial, tax, or professional advice. You are solely responsible for your own decisions and for
                complying with applicable laws, regulations, and third-party platform rules in your jurisdiction.
              </p>
            </DisclaimerSection>

            <DisclaimerSection title="No Guarantee of Results">
              <p>
                SHREE ADS does not guarantee income, leads, business success, advertising performance, financial results,
                or any other specific outcome. Results depend on many factors outside our control, including your niche,
                budget, creative assets, competition, and how you apply what you learn. Past examples or testimonials, if
                shown, are illustrative only and are not a promise of future results.
              </p>
            </DisclaimerSection>

            <DisclaimerSection title="Third-Party Platforms">
              <p>
                Our platform and courses may reference or demonstrate external tools, advertising or social platforms,
                software, payment providers, or other third-party services. Those services are independent of SHREE ADS
                and have their own terms, policies, and practices. SHREE ADS is not affiliated with, endorsed by, or
                responsible for the availability, accuracy, or conduct of any third-party service. Your relationship with
                any third party is solely between you and that provider.
              </p>
            </DisclaimerSection>

            <DisclaimerSection title="Account Suspension or Ban">
              <p>
                Third-party platforms may restrict, suspend, or permanently ban advertising accounts, business pages,
                or other online accounts for policy violations, review decisions, payment issues, or other reasons they
                determine. SHREE ADS is not responsible and shall not be liable if your accounts are restricted,
                suspended, or banned, or if you lose access to ads, pixels, audiences, or related assets. Such risks are
                inherent when operating online; you use third-party platforms at your own risk.
              </p>
            </DisclaimerSection>

            <DisclaimerSection title="Financial Loss Disclaimer">
              <p>
                Digital marketing and online business activities involve financial risk, including loss of money spent on
                advertising, tools, subscriptions, or inventory. SHREE ADS is not liable for any losses, damages, or
                expenses—direct or indirect—arising from your use of our platform, courses, materials, or strategies, or
                from your business or marketing activities. Only spend what you can afford to lose and obtain independent
                professional advice where appropriate.
              </p>
            </DisclaimerSection>

            <DisclaimerSection title="Acceptance of Disclaimer">
              <p>
                By accessing this website, browsing our content, or enrolling in any course or program on the SHREE ADS
                platform, you acknowledge that you have read, understood, and accept this disclaimer. If you do not
                agree, you must not use our services. We may update this disclaimer periodically; your continued use after
                changes are posted constitutes acceptance of the updated disclaimer.
              </p>
            </DisclaimerSection>

            <div className="legal-intro rounded-xl border border-border/60 bg-card/90 backdrop-blur-[2px] p-6 sm:p-8 shadow-sm">
              <h2 className="font-display text-lg sm:text-xl font-semibold mb-4 text-foreground">Contact Information</h2>
              <p className="text-muted-foreground text-sm sm:text-base mb-4 leading-relaxed">
                For questions about this disclaimer or the SHREE ADS platform, contact us:
              </p>
              <div className="space-y-3">
                <a
                  href="tel:+919265106657"
                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors text-sm sm:text-base"
                >
                  <Phone className="w-5 h-5 text-primary shrink-0" />
                  <span>Phone: +91 9265106657</span>
                </a>
                <a
                  href="mailto:shreeadsmall@gmail.com"
                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors text-sm sm:text-base"
                >
                  <Mail className="w-5 h-5 text-primary shrink-0" />
                  <span>Email: shreeadsmall@gmail.com</span>
                </a>
              </div>
            </div>
          </div>
      </motion.div>
    </LegalDocumentLayout>
  );
};

const DisclaimerSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-xl border border-border/60 bg-card/90 backdrop-blur-[2px] p-6 sm:p-8 shadow-sm">
    <h2 className="font-display text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-foreground">{title}</h2>
    <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-muted-foreground prose-p:leading-relaxed prose-p:mb-0">
      {children}
    </div>
  </section>
);

export default Disclaimer;
