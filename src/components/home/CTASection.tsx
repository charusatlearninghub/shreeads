import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CTASection = forwardRef<HTMLElement>((_, ref) => {
  return (
    <section ref={ref} className="py-20 lg:py-32 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 animated-gradient" />
            
            {/* Overlay Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>

            {/* Content */}
            <div className="relative z-10 px-4 py-12 sm:px-8 sm:py-16 lg:px-16 lg:py-24 text-center text-primary-foreground">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium mb-8"
              >
                <Gift className="w-4 h-4" />
                <span>Limited Time Offer</span>
              </motion.div>

              {/* Heading */}
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 max-w-3xl mx-auto">
                Start Your Learning Journey Today
              </h2>

              {/* Description */}
              <p className="text-lg opacity-90 max-w-2xl mx-auto mb-10">
                Get access to exclusive promo codes and enroll in premium courses. 
                Join our community of 10,000+ successful learners.
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="xl" 
                  className="bg-white text-primary hover:bg-white/90 shadow-xl"
                  asChild
                >
                  <Link to="/register">
                    <Sparkles className="w-5 h-5" />
                    Get Started Free
                  </Link>
                </Button>
                <Button 
                  size="xl" 
                  variant="outline"
                  className="border-2 border-white/50 text-primary-foreground bg-transparent hover:bg-white/20"
                  asChild
                >
                  <Link to="/courses">
                    Browse Courses
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 sm:mt-12 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-4 sm:gap-8 opacity-80">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold">10,000+</div>
                  <div className="text-sm opacity-80">Students</div>
                </div>
                <div className="hidden sm:block w-px h-10 bg-white/30" />
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold">50+</div>
                  <div className="text-sm opacity-80">Courses</div>
                </div>
                <div className="hidden sm:block w-px h-10 bg-white/30" />
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold">4.9★</div>
                  <div className="text-sm opacity-80">Rating</div>
                </div>
                <div className="hidden sm:block w-px h-10 bg-white/30" />
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold">500+</div>
                  <div className="text-sm opacity-80">Videos</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

CTASection.displayName = "CTASection";
