import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Percent, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useActivePromotions, ActivePromotionWithCourses } from '@/hooks/useActivePromotions';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, parseISO } from 'date-fns';

interface CountdownProps {
  endDate: string;
  className?: string;
}

const Countdown = ({ endDate, className = '' }: CountdownProps) => {
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
    <div className={`flex items-center gap-1.5 sm:gap-2 ${className}`}>
      <Clock className="w-3.5 h-3.5 shrink-0 sm:w-4 sm:h-4" />
      <div className="flex flex-wrap items-center justify-center gap-1 font-mono text-[10px] sm:text-sm lg:text-base">
        {timeLeft.days > 0 && (
          <>
            <span className="rounded bg-background/20 px-1.5 py-0.5">{timeLeft.days}d</span>
            <span>:</span>
          </>
        )}
        <span className="rounded bg-background/20 px-1.5 py-0.5">{String(timeLeft.hours).padStart(2, '0')}h</span>
        <span>:</span>
        <span className="rounded bg-background/20 px-1.5 py-0.5">{String(timeLeft.minutes).padStart(2, '0')}m</span>
        <span>:</span>
        <span className="rounded bg-background/20 px-1.5 py-0.5">{String(timeLeft.seconds).padStart(2, '0')}s</span>
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
        className={`relative mx-auto my-3 w-[calc(100%-1.5rem)] max-w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-primary-foreground shadow-lg shadow-purple-900/15 ${className}`}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/4 h-full w-1/2 rotate-12 bg-white/5 animate-pulse" />
          <div className="absolute -bottom-1/2 -right-1/4 h-full w-1/2 -rotate-12 bg-white/5 animate-pulse" />
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="absolute right-2.5 top-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-background/20 text-primary-foreground transition-colors hover:bg-background/30 sm:right-3 sm:top-3"
          aria-label="Dismiss banner"
        >
          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>

        <div className="relative z-10 grid gap-4 px-4 py-4 sm:px-5 sm:py-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(9rem,.65fr)_minmax(16rem,.9fr)] lg:items-center lg:gap-6">
          <div className="flex min-w-0 flex-col items-center gap-2 text-center sm:items-start sm:text-left">
              <div className="flex min-w-0 items-center justify-center gap-2 sm:justify-start">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background/20 sm:h-10 sm:w-10">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className="max-w-[14rem] text-sm font-bold leading-tight sm:max-w-none sm:text-lg lg:text-xl">
                  {currentPromotion.name}
                </h3>
              </div>

              {currentPromotion.description && (
                <p className="max-w-full text-xs leading-relaxed text-primary-foreground/90 sm:text-sm">
                  {currentPromotion.description}
                </p>
              )}
          </div>

          <div className="flex flex-col items-center gap-2 text-center lg:items-start lg:text-left">
            <div className="w-fit rounded-xl bg-background/20 px-4 py-2 backdrop-blur-sm">
              <div className="text-2xl font-black leading-none sm:text-3xl">
                {currentPromotion.discount_percentage}% OFF
              </div>
            </div>
            {currentPromotion.course_count > 0 && (
              <span className="text-xs text-primary-foreground/90 sm:text-sm">
                on {currentPromotion.course_count} course{currentPromotion.course_count > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center lg:w-auto lg:justify-end">
            <div className="flex flex-col items-center gap-2 sm:items-end">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-primary-foreground/75 sm:text-xs">
                Ends in
              </p>
              <Countdown endDate={currentPromotion.end_date} className="justify-center sm:justify-end" />
            </div>
            <Button
              variant="secondary"
              size="lg"
              asChild
              className="w-full max-w-full bg-background text-foreground shadow-lg hover:bg-background/90 sm:w-auto"
            >
              <Link to="/courses" className="w-full sm:w-auto">
                Browse Courses
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative mx-auto my-3 w-[calc(100%-1.5rem)] max-w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-primary-foreground shadow-lg shadow-purple-900/15 ${className}`}
    >
      <div className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-primary-foreground">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/4 w-1/2 h-full bg-white/5 rotate-12 animate-pulse" />
          <div className="absolute -bottom-1/2 -right-1/4 w-1/2 h-full bg-white/5 -rotate-12 animate-pulse" />
        </div>

        <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPromotion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left"
            >
              {/* Left side - Promotion info */}
              <div className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row sm:items-center sm:text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/20">
                    <Percent className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center justify-center gap-2 sm:justify-start">
                      <Sparkles className="h-4 w-4" />
                      <h3 className="text-base font-bold leading-tight sm:text-lg lg:text-xl">
                        {currentPromotion.name}
                      </h3>
                    </div>
                    {currentPromotion.description && (
                      <p className="mt-1 max-w-md text-xs leading-relaxed opacity-90 sm:text-sm">
                        {currentPromotion.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:ml-2">
                  <div className="rounded-xl bg-background/20 px-3 py-2 backdrop-blur-sm sm:px-4">
                    <span className="text-xl font-black sm:text-2xl lg:text-3xl">
                      {currentPromotion.discount_percentage}%
                    </span>
                    <span className="ml-1 text-xs sm:text-sm">OFF</span>
                  </div>
                  {currentPromotion.course_count > 0 && (
                    <span className="text-xs opacity-90 sm:text-sm">
                      on {currentPromotion.course_count} course{currentPromotion.course_count > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Right side - Countdown and CTA */}
              <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                <div className="text-center sm:text-right">
                  <p className="mb-1 text-[10px] uppercase tracking-[0.12em] opacity-75 sm:text-xs">Ends in</p>
                  <Countdown endDate={currentPromotion.end_date} className="justify-center sm:justify-end" />
                </div>
                <Button
                  variant="secondary"
                  size="lg"
                  asChild
                  className="w-full max-w-full bg-background text-foreground shadow-lg hover:bg-background/90 sm:w-auto"
                >
                  <Link to="/courses" className="w-full sm:w-auto">
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
