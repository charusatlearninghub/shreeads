import { useState, useEffect } from "react";
import { usePagination } from '@/hooks/usePagination';
import { TablePagination } from '@/components/admin/TablePagination';
import { motion } from "framer-motion";
import { 
  Star, 
  Check, 
  X, 
  Trash2, 
  Eye,
  Loader2,
  MessageSquare,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Review {
  id: string;
  user_id: string;
  course_id: string;
  rating: number;
  review_text: string;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
  course_title: string | null;
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      // Fetch reviews without embedded joins
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

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
        supabase.from('profiles').select('id, full_name, email').in('id', userIds),
        supabase.from('courses').select('id, title').in('id', courseIds)
      ]);

      const profilesMap = new Map(
        (profilesRes.data || []).map(p => [p.id, { full_name: p.full_name, email: p.email }])
      );
      const coursesMap = new Map(
        (coursesRes.data || []).map(c => [c.id, c.title])
      );

      // Combine data
      const enrichedReviews: Review[] = reviewsData.map(review => {
        const profile = profilesMap.get(review.user_id);
        return {
          ...review,
          user_name: profile?.full_name || null,
          user_email: profile?.email || null,
          course_title: coursesMap.get(review.course_id) || null,
        };
      });

      setReviews(enrichedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleApprove = async (reviewId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: approved })
        .eq('id', reviewId);

      if (error) throw error;
      
      setReviews(prev => prev.map(r => 
        r.id === reviewId ? { ...r, is_approved: approved } : r
      ));
      toast.success(approved ? 'Review approved' : 'Review unapproved');
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error('Failed to update review');
    }
  };

  const handleFeature = async (reviewId: string, featured: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_featured: featured })
        .eq('id', reviewId);

      if (error) throw error;
      
      setReviews(prev => prev.map(r => 
        r.id === reviewId ? { ...r, is_featured: featured } : r
      ));
      toast.success(featured ? 'Review featured on homepage' : 'Review removed from homepage');
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error('Failed to update review');
    }
  };

  const handleDelete = async () => {
    if (!deleteReviewId) return;
    
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', deleteReviewId);

      if (error) throw error;
      
      setReviews(prev => prev.filter(r => r.id !== deleteReviewId));
      toast.success('Review deleted');
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    } finally {
      setDeleteReviewId(null);
    }
  };

  const reviewsPagination = usePagination(reviews, { pageSize: 10 });
  const paginatedReviews = reviewsPagination.paginatedItems;

  const stats = {
    total: reviews.length,
    approved: reviews.filter(r => r.is_approved).length,
    pending: reviews.filter(r => !r.is_approved).length,
    featured: reviews.filter(r => r.is_featured).length,
  };

  return (
    <AdminLayout title="Reviews Management" subtitle="Approve and feature student reviews">
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.featured}</p>
                  <p className="text-xs text-muted-foreground">Featured</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews List */}
        <Card className="border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>All Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Reviews Yet</h3>
                <p className="text-muted-foreground">Reviews from students will appear here</p>
              </div>
            ) : (
              <>
              <div className="space-y-4">
                {paginatedReviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-lg border ${
                      !review.is_approved ? 'bg-yellow-500/5 border-yellow-500/20' : 'border-border'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                          {review.user_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{review.user_name || 'Unknown User'}</p>
                            {!review.is_approved && (
                              <Badge variant="warning" className="text-xs">Pending</Badge>
                            )}
                            {review.is_featured && (
                              <Badge variant="gradient" className="text-xs">Featured</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{review.course_title}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${
                              i < review.rating ? 'text-warning fill-warning' : 'text-muted'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-muted-foreground">{review.review_text}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={review.is_approved}
                          onCheckedChange={(checked) => handleApprove(review.id, checked)}
                        />
                        <span className="text-sm">Approved</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={review.is_featured}
                          onCheckedChange={(checked) => handleFeature(review.id, checked)}
                          disabled={!review.is_approved}
                        />
                        <span className="text-sm">Featured</span>
                      </div>
                      <div className="flex-1" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteReviewId(review.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
              <TablePagination
                currentPage={reviewsPagination.currentPage}
                totalPages={reviewsPagination.totalPages}
                totalItems={reviewsPagination.totalItems}
                pageSize={reviewsPagination.pageSize}
                onPageChange={reviewsPagination.goToPage}
              />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteReviewId} onOpenChange={() => setDeleteReviewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The review will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminReviews;
