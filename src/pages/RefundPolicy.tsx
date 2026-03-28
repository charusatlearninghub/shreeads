import { LegalDocumentLayout } from "@/components/layout/LegalDocumentLayout";
import { SeoHead } from "@/components/common/SeoHead";
import { motion } from "framer-motion";
import { RotateCcw, Phone, Mail, MapPin } from "lucide-react";

const RefundPolicy = () => {
  return (
    <LegalDocumentLayout pageId="refund">
      <SeoHead
        title="SHREE ADS Refund Policy – Course Refund Guidelines"
        description="Read the SHREE ADS refund policy to understand refund eligibility, conditions, and the refund request process for our online courses."
      />
      <motion.article
        className="w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <header className="text-center mb-10 sm:mb-12">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <RotateCcw className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold px-1 text-foreground">
            SHREE ADS – Refund Policy
          </h1>
        </header>

        <div className="legal-intro rounded-xl border border-border/60 bg-card/90 backdrop-blur-[2px] p-6 sm:p-8 mb-6 sm:mb-8 shadow-sm">
          <p className="text-muted-foreground leading-[1.7]">
            At SHREE ADS, we aim to provide high-quality courses and a positive learning experience for all students.
          </p>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <RefundSection number={1} title="Refund Eligibility">
            <p className="text-muted-foreground mb-3">Refund requests may be accepted if:</p>
            <ul className="list-disc list-outside ml-5 sm:ml-6 space-y-1.5 text-muted-foreground">
              <li>
                The request is made within <strong className="text-foreground font-semibold">3 days of purchase</strong>
              </li>
              <li>
                The course has <strong className="text-foreground font-semibold">not been significantly accessed</strong>
              </li>
              <li>
                No <strong className="text-foreground font-semibold">downloadable content</strong> has been used
              </li>
            </ul>
          </RefundSection>

          <RefundSection number={2} title="Non-Refundable Cases">
            <p className="text-muted-foreground mb-3">Refunds may not be granted if:</p>
            <ul className="list-disc list-outside ml-5 sm:ml-6 space-y-1.5 text-muted-foreground">
              <li>
                The course has been <strong className="text-foreground font-semibold">fully accessed</strong>
              </li>
              <li>
                The request is made <strong className="text-foreground font-semibold">after the refund period</strong>
              </li>
              <li>
                The purchase was made during{" "}
                <strong className="text-foreground font-semibold">special promotional offers</strong>
              </li>
              <li>
                The user <strong className="text-foreground font-semibold">violated platform policies</strong>
              </li>
            </ul>
          </RefundSection>

          <RefundSection number={3} title="Refund Request Process">
            <p className="text-muted-foreground mb-3">To request a refund:</p>
            <ol className="list-decimal list-outside ml-5 sm:ml-6 space-y-1.5 text-muted-foreground mb-4">
              <li>Contact our support team</li>
              <li>Provide payment details</li>
              <li>Provide the reason for the refund request</li>
            </ol>
            <p className="text-muted-foreground leading-[1.7]">
              Our support team will review the request and respond accordingly.
            </p>
          </RefundSection>

          <RefundSection number={4} title="Processing Time">
            <p className="text-muted-foreground leading-[1.7]">
              If approved, refunds will be processed within{" "}
              <strong className="text-foreground font-semibold">7–10 business days</strong>, depending on the payment
              method used.
            </p>
          </RefundSection>

          <RefundSection number={5} title="Contact Support">
            <div className="space-y-4">
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
          </RefundSection>
        </div>
      </motion.article>
    </LegalDocumentLayout>
  );
};

const RefundSection = ({
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
      Section {number} – {title}
    </h2>
    <div className="[&_ol]:my-0 [&_ul]:my-0">{children}</div>
  </section>
);

export default RefundPolicy;
