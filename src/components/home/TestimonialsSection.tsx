import { forwardRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Quote, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  user_id: string;
  course_id: string;
  user_name: string | null;
  course_title: string | null;
}

export const TestimonialsSection = forwardRef<HTMLElement>((_, ref) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Fetch latest approved reviews (3-6)
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('id, rating, review_text, created_at, user_id, course_id')
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
          .limit(6);

        if (reviewsError) throw reviewsError;

        if (!reviewsData || reviewsData.length === 0) {
          setReviews([]);
          setIsLoading(false);
          return;
        }

        // Get unique user IDs and course IDs
        const userIds = [...new Set(reviewsData.map(r => r.user_id))];
        const courseIds = [...new Set(reviewsData.map(r => r.course_id))];

        // Fetch profiles and courses separately
        const [profilesRes, coursesRes] = await Promise.all([
          supabase.from('profiles').select('id, full_name').in('id', userIds),
          supabase.from('courses').select('id, title').in('id', courseIds)
        ]);

        const profilesMap = new Map(
          (profilesRes.data || []).map(p => [p.id, p.full_name])
        );
        const coursesMap = new Map(
          (coursesRes.data || []).map(c => [c.id, c.title])
        );

        // Combine data
        const enrichedReviews: Review[] = reviewsData.map(review => ({
          ...review,
          user_name: profilesMap.get(review.user_id) || null,
          course_title: coursesMap.get(review.course_id) || null,
        }));

        setReviews(enrichedReviews);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const displayTestimonials = reviews.map(review => ({
    id: review.id,
    name: review.user_name || 'Anonymous',
    role: review.course_title || 'Student',
    content: review.review_text,
    rating: review.rating,
  }));

  return (
    <section ref={ref} className="py-20 lg:py-32 bg-gradient-surface relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Testimonials
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            What Our <span className="gradient-text">Students Say</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of satisfied learners who have transformed their careers with our platform.
          </p>
        </motion.div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : displayTestimonials.length === 0 ? (
          <div className="text-center py-16 max-w-xl mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Quote className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">No reviews yet</h3>
            <p className="text-muted-foreground">
              Be the first to share your experience.
            </p>
          </div>
        ) : (
          /* Testimonials Grid */
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {displayTestimonials.slice(0, 3).map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="h-full p-8 bg-card rounded-2xl border border-border/50 shadow-card relative">
                  {/* Quote Icon */}
                  <div className="absolute -top-4 left-8">
                    <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
                      <Quote className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex gap-1 mb-4 pt-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-warning fill-warning" />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    "{testimonial.content}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

TestimonialsSection.displayName = "TestimonialsSection";
