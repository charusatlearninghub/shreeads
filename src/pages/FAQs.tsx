import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { HelpCircle, Phone, Mail } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is ShreeAds?",
    answer: "ShreeAds is an online learning platform that provides training and education about digital advertising and online marketing."
  },
  {
    question: "Who can join the course?",
    answer: "Anyone interested in digital marketing or online business can join."
  },
  {
    question: "Do I need previous experience?",
    answer: "No. Our courses are designed for beginners and intermediate learners."
  },
  {
    question: "How will I receive course access?",
    answer: "After payment, course access will be provided through your account or email."
  },
  {
    question: "Can I access the course on mobile?",
    answer: "Yes, courses can be accessed on mobile, tablet, or computer."
  },
];

const FAQs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 lg:py-20 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl lg:text-4xl font-bold mb-3">Frequently Asked Questions</h1>
            <p className="text-muted-foreground text-lg">Find answers to common questions about ShreeAds.</p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="rounded-xl border border-border bg-card px-6">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 rounded-xl border border-border bg-card p-6 text-center">
            <h2 className="font-display text-xl font-semibold mb-4">Still have questions?</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="tel:+919265106657" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Phone className="w-5 h-5 text-primary" />
                <span>+91 9265106657</span>
              </a>
              <a href="mailto:shreeadsmall@gmail.com" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Mail className="w-5 h-5 text-primary" />
                <span>shreeadsmall@gmail.com</span>
              </a>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQs;
