import { LegalDocumentLayout } from "@/components/layout/LegalDocumentLayout";
import { SeoHead } from "@/components/common/SeoHead";
import { motion } from "framer-motion";
import { Shield, Phone, Mail, MapPin } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <LegalDocumentLayout pageId="privacy">
      <SeoHead
        title="SHREE ADS Privacy Policy – Digital Marketing Course Platform"
        description="Read the SHREE ADS Privacy Policy to understand how we collect, use, and protect your personal information when using our platform."
      />
      <motion.article
        className="w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
          <header className="text-center mb-10 sm:mb-12">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 px-1">
              SHREE ADS – Privacy Policy
            </h1>
          </header>

          <div className="legal-intro rounded-xl border border-border bg-card/90 backdrop-blur-[2px] p-6 sm:p-8 mb-6 sm:mb-8 shadow-sm">
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              ShreeAds (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) respects your privacy and is committed to protecting your
              personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you
              use our website and services.
            </p>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <PolicySection title="Information We Collect">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-4">
                We collect information needed to operate our platform and deliver our services.
              </p>

              <h3 className="font-semibold text-foreground text-sm sm:text-base mb-2">Personal Information</h3>
              <ul className="list-disc list-outside ml-5 sm:ml-6 space-y-1.5 text-muted-foreground text-sm sm:text-base mb-5">
                <li>Full Name</li>
                <li>Email Address</li>
                <li>Phone Number</li>
                <li>Billing Information</li>
              </ul>

              <h3 className="font-semibold text-foreground text-sm sm:text-base mb-2">Payment Information</h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-5">
                Payments are processed through secure third-party payment gateways. SHREE ADS does not store sensitive
                payment information such as full card details.
              </p>

              <h3 className="font-semibold text-foreground text-sm sm:text-base mb-2">Technical Information</h3>
              <ul className="list-disc list-outside ml-5 sm:ml-6 space-y-1.5 text-muted-foreground text-sm sm:text-base">
                <li>IP address</li>
                <li>Device type</li>
                <li>Browser type</li>
                <li>Website usage data</li>
              </ul>
            </PolicySection>

            <PolicySection title="How We Use Your Information">
              <p className="text-muted-foreground text-sm sm:text-base mb-3">We use your information to:</p>
              <ul className="list-disc list-outside ml-5 sm:ml-6 space-y-1.5 text-muted-foreground text-sm sm:text-base">
                <li>Provide access to purchased courses</li>
                <li>Process payments and transactions</li>
                <li>Send course updates and important notifications</li>
                <li>Improve platform performance and services</li>
                <li>Provide customer support</li>
                <li>Prevent fraud and misuse</li>
              </ul>
            </PolicySection>

            <PolicySection title="Cookies">
              <p className="text-muted-foreground text-sm sm:text-base mb-3">Our website may use cookies and similar technologies to:</p>
              <ul className="list-disc list-outside ml-5 sm:ml-6 space-y-1.5 text-muted-foreground text-sm sm:text-base mb-4">
                <li>Improve user experience</li>
                <li>Understand website traffic</li>
                <li>Analyze user behavior</li>
              </ul>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Users may disable cookies through browser settings, but some website features may not work properly.
              </p>
            </PolicySection>

            <PolicySection title="Third-Party Services">
              <p className="text-muted-foreground text-sm sm:text-base mb-3">We may use trusted third-party services such as:</p>
              <ul className="list-disc list-outside ml-5 sm:ml-6 space-y-1.5 text-muted-foreground text-sm sm:text-base mb-4">
                <li>Payment gateways</li>
                <li>Analytics tools</li>
                <li>Email communication services</li>
                <li>Marketing tools</li>
              </ul>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                These providers have their own privacy policies for handling personal data.
              </p>
            </PolicySection>

            <PolicySection title="Data Security">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-3">
                We implement appropriate technical and organizational security measures to protect user data from
                unauthorized access, misuse, or loss.
              </p>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                However, no online system can be guaranteed to be completely secure.
              </p>
            </PolicySection>

            <PolicySection title="User Responsibilities">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Users must keep their login credentials secure. SHREE ADS is not responsible for unauthorized access
                caused by sharing account credentials.
              </p>
            </PolicySection>

            <PolicySection title="Changes to Privacy Policy">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                SHREE ADS may update this Privacy Policy from time to time. Updated versions will be posted on this page
                with the revised date.
              </p>
            </PolicySection>

            <div className="legal-intro rounded-xl border border-border/60 bg-card/90 backdrop-blur-[2px] p-6 sm:p-8 shadow-sm">
              <h2 className="font-display text-lg sm:text-xl font-semibold mb-4 text-foreground">Contact Information</h2>
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
            </div>
          </div>
      </motion.article>
    </LegalDocumentLayout>
  );
};

const PolicySection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-xl border border-border/60 bg-card/90 backdrop-blur-[2px] p-6 sm:p-8 shadow-sm">
    <h2 className="font-display text-lg sm:text-xl font-semibold mb-4 text-foreground">{title}</h2>
    <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-p:mb-0 [&_ul]:my-0">
      {children}
    </div>
  </section>
);

export default PrivacyPolicy;
