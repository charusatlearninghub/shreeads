import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, User, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  user_name: string;
  avatar_url: string | null;
}

interface CourseReviewsProps {
  courseId: string;
  refreshTrigger?: number;
}

type SortOption = "newest" | "oldest" | "highest" | "lowest";

const REVIEWS_PER_PAGE = 5;

export const CourseReviews = ({ courseId, refreshTrigger }: CourseReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        // Get total count first
        const { count, error: countError } = await supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', courseId)
          .eq('is_approved', true);

        if (countError) throw countError;
        setTotalCount(count || 0);

        // Determine sort order
        let orderColumn = 'created_at';
        let ascending = false;

        if (sortBy === 'oldest') {
          orderColumn = 'created_at';
          ascending = true;
        } else if (sortBy === 'highest') {
          orderColumn = 'rating';
          ascending = false;
        } else if (sortBy === 'lowest') {
          orderColumn = 'rating';
          ascending = true;
        }

        // Calculate offset
        const offset = (currentPage - 1) * REVIEWS_PER_PAGE;

        // Fetch paginated reviews
        const { data: reviewsData, error } = await supabase
          .from('reviews')
          .select('id, rating, review_text, created_at, user_id')
          .eq('course_id', courseId)
          .eq('is_approved', true)
          .order(orderColumn, { ascending })
          .range(offset, offset + REVIEWS_PER_PAGE - 1);

        if (error) throw error;

        // Fetch user profiles for the reviews
        if (reviewsData && reviewsData.length > 0) {
          const userIds = reviewsData.map(r => r.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);

          const reviewsWithProfiles = reviewsData.map(review => {
            const profile = profiles?.find(p => p.id === review.user_id);
            return {
              id: review.id,
              rating: review.rating,
              review_text: review.review_text,
              created_at: review.created_at,
              user_name: profile?.full_name || 'Anonymous',
              avatar_url: profile?.avatar_url,
            };
          });

          setReviews(reviewsWithProfiles);
        } else {
          setReviews([]);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [courseId, refreshTrigger, currentPage, sortBy]);

  // Reset to page 1 when sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-warning fill-warning'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  const totalPages = Math.ceil(totalCount / REVIEWS_PER_PAGE);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (totalCount === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-warning fill-warning" />
            Student Reviews
            <span className="text-muted-foreground font-normal text-base">
              ({totalCount} {totalCount === 1 ? 'review' : 'reviews'})
            </span>
          </CardTitle>
          
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest">Highest Rated</SelectItem>
              <SelectItem value="lowest">Lowest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="border-b border-border last:border-0 pb-6 last:pb-0"
          >
            <div className="flex items-start gap-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src={review.avatar_url || undefined} />
                <AvatarFallback>
                  <User className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium">{review.user_name}</h4>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  </span>
                </div>
                
                <div className="mb-2">
                  {renderStars(review.rating)}
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {review.review_text}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
