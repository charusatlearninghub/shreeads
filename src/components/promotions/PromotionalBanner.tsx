import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Percent, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useActivePromotions, ActivePromotionWithCourses } from '@/hooks/useActivePromotions';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, parseISO } from 'date-fns';

interface CountdownProps {
  endDate: string;
}

const Countdown = ({ endDate }: CountdownProps) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = parseISO(endDate);
      const now = new Date();
      
      if (end <= now) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const days = differenceInDays(end, now);
      const hours = differenceInHours(end, now) % 24;
      const minutes = differenceInMinutes(end, now) % 60;
      const seconds = differenceInSeconds(end, now) % 60;

      return { days, hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Clock className="w-4 h-4" />
      <div className="flex items-center gap-1 font-mono text-sm sm:text-base">
        {timeLeft.days > 0 && (
          <>
            <span className="bg-background/20 px-1.5 py-0.5 rounded">{timeLeft.days}d</span>
            <span>:</span>
          </>
        )}
        <span className="bg-background/20 px-1.5 py-0.5 rounded">{String(timeLeft.hours).padStart(2, '0')}h</span>
        <span>:</span>
        <span className="bg-background/20 px-1.5 py-0.5 rounded">{String(timeLeft.minutes).padStart(2, '0')}m</span>
        <span>:</span>
        <span className="bg-background/20 px-1.5 py-0.5 rounded">{String(timeLeft.seconds).padStart(2, '0')}s</span>
      </div>
    </div>
  );
};

interface PromotionalBannerProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export const PromotionalBanner = ({ variant = 'full', className = '' }: PromotionalBannerProps) => {
  const { data: promotions, isLoading } = useActivePromotions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!promotions || promotions.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [promotions]);

  if (isLoading || !promotions || promotions.length === 0 || dismissed) {
    return null;
  }

  const currentPromotion = promotions[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + promotions.length) % promotions.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % promotions.length);
  };

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-primary-foreground py-2 px-4 ${className}`}
      >
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold">{currentPromotion.name}</span>
            </div>
            <span className="bg-background/20 px-2 py-0.5 rounded-full text-sm font-bold">
              {currentPromotion.discount_percentage}% OFF
            </span>
            <Countdown endDate={currentPromotion.end_date} />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-primary-foreground hover:text-primary-foreground hover:bg-background/20"
            >
              <Link to="/courses">Shop Now</Link>
            </Button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-background/20 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden ${className}`}
    >
      <div className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-primary-foreground">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/4 w-1/2 h-full bg-white/5 rotate-12 animate-pulse" />
          <div className="absolute -bottom-1/2 -right-1/4 w-1/2 h-full bg-white/5 -rotate-12 animate-pulse" />
        </div>

        <div className="container mx-auto px-4 py-4 sm:py-6 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPromotion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              {/* Left side - Promotion info */}
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-background/20 flex items-center justify-center">
                    <Percent className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <h3 className="font-display text-lg sm:text-xl font-bold">
                        {currentPromotion.name}
                      </h3>
                    </div>
                    {currentPromotion.description && (
                      <p className="text-sm opacity-90 max-w-md">
                        {currentPromotion.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-background/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                    <span className="text-2xl sm:text-3xl font-bold">
                      {currentPromotion.discount_percentage}%
                    </span>
                    <span className="text-sm ml-1">OFF</span>
                  </div>
                  {currentPromotion.course_count > 0 && (
                    <span className="text-sm opacity-90">
                      on {currentPromotion.course_count} course{currentPromotion.course_count > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Right side - Countdown and CTA */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="text-center sm:text-right">
                  <p className="text-xs opacity-75 mb-1">Ends in</p>
                  <Countdown endDate={currentPromotion.end_date} />
                </div>
                <Button
                  variant="secondary"
                  size="lg"
                  asChild
                  className="bg-background text-foreground hover:bg-background/90 shadow-lg"
                >
                  <Link to="/courses">
                    Browse Courses
                  </Link>
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation arrows for multiple promotions */}
          {promotions.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/20 hover:bg-background/30 transition-colors"
                aria-label="Previous promotion"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/20 hover:bg-background/30 transition-colors"
                aria-label="Next promotion"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dots indicator */}
              <div className="flex justify-center gap-2 mt-3">
                {promotions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'bg-background w-6'
                        : 'bg-background/40 hover:bg-background/60'
                    }`}
                    aria-label={`Go to promotion ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-background/20 hover:bg-background/30 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
