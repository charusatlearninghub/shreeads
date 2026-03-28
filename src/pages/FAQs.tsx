import { Link } from "react-router-dom";
import { DocumentPageLayout } from "@/components/layout/DocumentPageLayout";
import { SeoHead } from "@/components/common/SeoHead";
import { motion } from "framer-motion";
import { HelpCircle, Phone, Mail } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQs = () => {
  return (
    <DocumentPageLayout>
      <SeoHead
        title="SHREE ADS FAQs – Digital Marketing Course Platform"
        description="Find answers to common questions about SHREE ADS courses, access, payments, and support."
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
              SHREE ADS – Frequently Asked Questions (FAQs)
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Here are answers to some common questions about ShreeAds courses and services.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
            <AccordionItem value="item-1" className="rounded-xl border border-border bg-card px-4 sm:px-6 data-[state=open]:shadow-sm">
              <AccordionTrigger className="text-left font-semibold text-sm sm:text-base hover:no-underline py-4 sm:py-5">
                What is ShreeAds?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm sm:text-base leading-relaxed pb-5">
                ShreeAds is an online learning platform that provides digital marketing courses, tools, and training to
                help individuals and businesses grow their online presence and advertising skills.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="rounded-xl border border-border bg-card px-4 sm:px-6 data-[state=open]:shadow-sm">
              <AccordionTrigger className="text-left font-semibold text-sm sm:text-base hover:no-underline py-4 sm:py-5">
                Who can join the course?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm sm:text-base leading-relaxed pb-5">
                <p className="mb-3">Anyone interested in learning digital marketing can join, including:</p>
                <ul className="list-disc list-outside ml-5 space-y-1.5 mb-3">
                  <li>Students</li>
                  <li>Freelancers</li>
                  <li>Business owners</li>
                  <li>Job seekers</li>
                  <li>Marketing professionals</li>
                </ul>
                <p>No special qualification is required.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="rounded-xl border border-border bg-card px-4 sm:px-6 data-[state=open]:shadow-sm">
              <AccordionTrigger className="text-left font-semibold text-sm sm:text-base hover:no-underline py-4 sm:py-5">
                Do I need previous experience?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm sm:text-base leading-relaxed pb-5 space-y-3">
                <p>No. Our courses are designed for both beginners and experienced learners.</p>
                <p>We start from basic concepts and gradually move to advanced strategies.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="rounded-xl border border-border bg-card px-4 sm:px-6 data-[state=open]:shadow-sm">
              <AccordionTrigger className="text-left font-semibold text-sm sm:text-base hover:no-underline py-4 sm:py-5">
                How will I receive course access?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm sm:text-base leading-relaxed pb-5">
                <p className="mb-3">Once your payment is completed, you will receive:</p>
                <ul className="list-disc list-outside ml-5 space-y-1.5">
                  <li>Course access in your ShreeAds dashboard</li>
                  <li>A confirmation email with instructions</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="rounded-xl border border-border bg-card px-4 sm:px-6 data-[state=open]:shadow-sm">
              <AccordionTrigger className="text-left font-semibold text-sm sm:text-base hover:no-underline py-4 sm:py-5">
                Can I access the course on mobile?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm sm:text-base leading-relaxed pb-5">
                <p className="mb-3">Yes. Our platform works on:</p>
                <ul className="list-disc list-outside ml-5 space-y-1.5 mb-3">
                  <li>Mobile phones</li>
                  <li>Tablets</li>
                  <li>Laptops</li>
                  <li>Desktop computers</li>
                </ul>
                <p>For the best experience, we recommend using the Google Chrome browser.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="rounded-xl border border-border bg-card px-4 sm:px-6 data-[state=open]:shadow-sm">
              <AccordionTrigger className="text-left font-semibold text-sm sm:text-base hover:no-underline py-4 sm:py-5">
                Is there lifetime access?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm sm:text-base leading-relaxed pb-5">
                Course access duration depends on the specific course plan. Please check the course details before
                purchasing.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="rounded-xl border border-border bg-card px-4 sm:px-6 data-[state=open]:shadow-sm">
              <AccordionTrigger className="text-left font-semibold text-sm sm:text-base hover:no-underline py-4 sm:py-5">
                Can I get a refund?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm sm:text-base leading-relaxed pb-5">
                Refund requests are accepted according to our{" "}
                <Link to="/refund-policy" className="text-primary font-medium underline underline-offset-2 hover:no-underline">
                  Refund Policy
                </Link>
                , usually within 3 days of purchase if the course has not been significantly accessed.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-10 sm:mt-12 rounded-xl border border-border bg-card p-6 sm:p-8">
            <h2 className="font-display text-lg sm:text-xl font-semibold mb-4 text-center">Still Have Questions?</h2>
            <p className="text-muted-foreground text-sm sm:text-base text-center mb-6 leading-relaxed">
              If you cannot find your answer here, contact our support team.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <a
                href="tel:+919265106657"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm sm:text-base"
              >
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span>Phone: +91 9265106657</span>
              </a>
              <a
                href="mailto:shreeadsmall@gmail.com"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm sm:text-base"
              >
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span>Email: shreeadsmall@gmail.com</span>
              </a>
            </div>
          </div>
      </motion.div>
    </DocumentPageLayout>
  );
};

export default FAQs;
