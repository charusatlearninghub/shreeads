import { LegalDocumentLayout } from "@/components/layout/LegalDocumentLayout";
import { SeoHead } from "@/components/common/SeoHead";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

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
              SHREE ADS (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy and is committed to protecting your personal
              information. This Privacy Policy explains how we collect, use, and protect information when you use the
              SHREE ADS application and related services.
            </p>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <PolicySection title="Information We Collect">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-4">
                Depending on how you use the application, SHREE ADS may collect the following information:
              </p>

              <h3 className="font-semibold text-foreground text-sm sm:text-base mb-2">Personal Information</h3>
              <ul className="list-disc list-outside ml-5 sm:ml-6 space-y-1.5 text-muted-foreground text-sm sm:text-base mb-5">
                <li>Full Name</li>
                <li>Email Address</li>
                <li>Phone Number</li>
                <li>Account login information</li>
              </ul>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                This information may be used to create and manage your account, provide course access, communicate with
                you, and provide customer support.
              </p>
            </PolicySection>

            <PolicySection title="Course Enrollment">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-3">
                Students who want to enroll in a course can contact SHREE ADS through the available WhatsApp contact
                option. SHREE ADS may provide an enrollment or promotional code to the student.
              </p>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                The student can enter the provided promo code in the application. If the code is valid and applicable, the
                student can enroll in the relevant course.
              </p>
            </PolicySection>

            <PolicySection title="How We Use Your Information">
              <p className="text-muted-foreground text-sm sm:text-base mb-3">We may use collected information to:</p>
              <ul className="list-disc list-outside ml-5 sm:ml-6 space-y-1.5 text-muted-foreground text-sm sm:text-base">
                <li>Create and manage user accounts</li>
                <li>Provide access to enrolled courses</li>
                <li>Process and validate course promo codes</li>
                <li>Track course enrollment and learning progress</li>
                <li>Provide customer support</li>
                <li>Send important account and course-related notifications</li>
                <li>Improve the application and learning experience</li>
                <li>Maintain the security and proper functioning of the platform</li>
              </ul>
            </PolicySection>

            <PolicySection title="WhatsApp Communication">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-3">
                The application may provide a WhatsApp contact button so students can contact SHREE ADS regarding
                courses, enrollment, support, or other queries.
              </p>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                When you use the WhatsApp button, communication takes place through WhatsApp and is subject to
                WhatsApp&apos;s own privacy policy and terms. SHREE ADS does not control how WhatsApp processes information
                shared through its service.
              </p>
            </PolicySection>

            <PolicySection title="Cookies and Similar Technologies">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                The SHREE ADS website or related services may use cookies or similar technologies to improve user
                experience and website functionality. The availability and use of cookies may depend on the specific
                website or service being accessed.
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

            <PolicySection title="Account Security">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Users are responsible for keeping their account credentials and promo codes secure. Users should not
                share their login credentials or personal enrollment information with unauthorized persons.
              </p>
            </PolicySection>

            <PolicySection title="Data Retention">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-3">
                SHREE ADS retains personal information only for as long as reasonably necessary to provide the services,
                maintain user accounts, manage course enrollment, comply with applicable requirements, and resolve
                disputes or support requests.
              </p>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                When information is no longer required, it may be deleted or securely disposed of where appropriate.
              </p>
            </PolicySection>

            <PolicySection title="Children's Privacy">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                SHREE ADS is an educational platform. Users should provide accurate information when creating an
                account. If a parent or guardian believes that personal information has been provided by a child without
                appropriate consent, they may contact SHREE ADS so that the matter can be reviewed and appropriate action
                can be taken.
              </p>
            </PolicySection>

            <PolicySection title="Changes to This Privacy Policy">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                SHREE ADS may update this Privacy Policy from time to time. If changes are made, the updated Privacy
                Policy will be published on this page with the revised date.
              </p>
            </PolicySection>

            <PolicySection title="Contact Us">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                If you have questions, concerns, or requests regarding this Privacy Policy or your personal information,
                you can contact SHREE ADS through the contact options provided within the application or on the official
                SHREE ADS website.
              </p>
            </PolicySection>
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
