import { LegalDocumentLayout } from "@/components/layout/LegalDocumentLayout";
import { SeoHead } from "@/components/common/SeoHead";
import { motion } from "framer-motion";
import { FileText, Phone, Mail, MapPin } from "lucide-react";

const TermsOfService = () => {
  return (
    <LegalDocumentLayout pageId="terms">
      <SeoHead
        title="SHREE ADS Terms of Service – Digital Marketing Learning Platform"
        description="Read the Terms of Service for SHREE ADS to understand the rules, conditions, and policies for using our courses and services."
      />
      <motion.article
        className="w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
          <header className="text-center mb-10 sm:mb-12">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 px-1">
              SHREE ADS – Terms of Service
            </h1>
          </header>

          <div className="legal-intro rounded-xl border border-border/60 bg-card/90 backdrop-blur-[2px] p-6 sm:p-8 mb-6 sm:mb-8 shadow-sm">
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              By accessing or using the ShreeAds website and services, you agree to the following terms and conditions.
            </p>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <TermsSection number={1} title="Website Usage">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Users must use the website legally and responsibly. Any misuse, illegal activity, or violation of these
                terms may result in account suspension or termination.
              </p>
            </TermsSection>

            <TermsSection number={2} title="User Accounts">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-3">
                To access certain features of the platform, users may be required to create an account.
              </p>
              <p className="text-muted-foreground text-sm sm:text-base mb-2">Users are responsible for:</p>
              <ul className="list-disc list-outside ml-5 sm:ml-6 space-y-1.5 text-muted-foreground text-sm sm:text-base">
                <li>Maintaining the confidentiality of their login credentials</li>
                <li>Ensuring the accuracy of their information</li>
                <li>All activities that occur under their account</li>
              </ul>
            </TermsSection>

            <TermsSection number={3} title="Course Access">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-3">
                Courses purchased on SHREE ADS are intended for individual use only.
              </p>
              <p className="text-muted-foreground text-sm sm:text-base mb-2">Users are strictly prohibited from:</p>
              <ul className="list-disc list-outside ml-5 sm:ml-6 space-y-1.5 text-muted-foreground text-sm sm:text-base mb-4">
                <li>Sharing login credentials</li>
                <li>Distributing course materials</li>
                <li>Recording or copying course videos</li>
                <li>Uploading course content elsewhere</li>
              </ul>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Violation of these rules may result in account termination without refund.
              </p>
            </TermsSection>

            <TermsSection number={4} title="Intellectual Property">
              <p className="text-muted-foreground text-sm sm:text-base mb-3">
                All content available on the SHREE ADS platform, including:
              </p>
              <ul className="list-disc list-outside ml-5 sm:ml-6 space-y-1.5 text-muted-foreground text-sm sm:text-base mb-4">
                <li>Course videos</li>
                <li>Training materials</li>
                <li>Graphics</li>
                <li>Documents</li>
                <li>Software tools</li>
              </ul>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-3">
                is the intellectual property of SHREE ADS and is protected by copyright laws.
              </p>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Unauthorized copying, distribution, or resale of this content is prohibited.
              </p>
            </TermsSection>

            <TermsSection number={5} title="Payments">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-3">
                All payments must be made through the payment options available on the platform.
              </p>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Course prices may change without prior notice.
              </p>
            </TermsSection>

            <TermsSection number={6} title="Limitation of Liability">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-3">
                SHREE ADS provides educational content for learning purposes only.
              </p>
              <p className="text-muted-foreground text-sm sm:text-base mb-2">We do not guarantee:</p>
              <ul className="list-disc list-outside ml-5 sm:ml-6 space-y-1.5 text-muted-foreground text-sm sm:text-base mb-4">
                <li>Advertising results</li>
                <li>Business growth</li>
                <li>Financial success</li>
              </ul>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Users apply course knowledge and strategies at their own risk.
              </p>
            </TermsSection>

            <TermsSection number={7} title="Account Suspension">
              <p className="text-muted-foreground text-sm sm:text-base mb-3">
                SHREE ADS reserves the right to suspend or terminate accounts that:
              </p>
              <ul className="list-disc list-outside ml-5 sm:ml-6 space-y-1.5 text-muted-foreground text-sm sm:text-base">
                <li>Violate these terms</li>
                <li>Misuse the platform</li>
                <li>Share copyrighted content</li>
              </ul>
            </TermsSection>

            <TermsSection number={8} title="Changes to Terms">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                SHREE ADS may update these Terms of Service at any time. Continued use of the platform after updates
                indicates acceptance of the revised terms.
              </p>
            </TermsSection>

            <TermsSection number={9} title="Contact Information">
              <div className="space-y-4 text-sm sm:text-base">
                <a
                  href="tel:+919265106657"
                  className="flex items-start gap-3 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>Phone / WhatsApp: +91 9265106657</span>
                </a>
                <a
                  href="mailto:shreeadsmall@gmail.com"
                  className="flex items-start gap-3 text-muted-foreground hover:text-primary transition-colors break-all"
                >
                  <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>Email: shreeadsmall@gmail.com</span>
                </a>
                <div className="flex items-start gap-3 text-muted-foreground">
                  <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>
                    Address:
                    <br />
                    Mahuva, Bhavnagar
                    <br />
                    Gujarat – 364290
                    <br />
                    India
                  </span>
                </div>
              </div>
            </TermsSection>
          </div>
      </motion.article>
    </LegalDocumentLayout>
  );
};

const TermsSection = ({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-xl border border-border/60 bg-card/90 backdrop-blur-[2px] p-6 sm:p-8 shadow-sm">
    <h2 className="font-display text-lg sm:text-xl font-semibold mb-4 text-foreground">
      {number}. {title}
    </h2>
    <div className="text-sm sm:text-base [&_ul]:my-0">{children}</div>
  </section>
);

export default TermsOfService;
