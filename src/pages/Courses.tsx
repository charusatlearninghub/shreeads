import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Search, 
  BookOpen, 
  Users,
  Loader2,
  Ticket,
  Gift
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/common/SeoHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { usePromoCode } from "@/hooks/usePromoCode";
import { useAuth } from "@/contexts/AuthContext";
import { CoursePriceDisplay } from "@/components/course/CoursePriceDisplay";
import { PromotionalBanner } from "@/components/promotions/PromotionalBanner";

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty_level: string | null;
  thumbnail_url: string | null;
  price: number | null;
  discount_price: number | null;
  is_free: boolean | null;
  lesson_count: number;
  enrollment_count: number;
}

const levels = ["All Levels", "Beginner", "Intermediate", "Advanced"];

const levelColors: Record<string, "success" | "warning" | "destructive"> = {
  Beginner: "success",
  Intermediate: "warning",
  Advanced: "destructive",
};

const CoursesContent = ({ user }: { user: any }) => {
  const { redeemPromoCode, isRedeeming } = usePromoCode();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All Levels");
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [showPromoDialog, setShowPromoDialog] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState("");

  const handleRedeemCode = async () => {
    const result = await redeemPromoCode(promoCodeInput);
    if (result?.success) {
      setShowPromoDialog(false);
      setPromoCodeInput("");
      fetchCourses();
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          category,
          difficulty_level,
          thumbnail_url,
          price,
          discount_price,
          is_free
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const coursesWithCounts = await Promise.all(
        (coursesData || []).map(async (course) => {
          const { count: lessonCount } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          const { count: enrollmentCount } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          return {
            ...course,
            lesson_count: lessonCount || 0,
            enrollment_count: enrollmentCount || 0,
          };
        })
      );

      setCourses(coursesWithCounts);

      const uniqueCategories = [...new Set(
        coursesWithCounts
          .map(c => c.category)
          .filter((c): c is string => c !== null)
      )];
      setCategories(["All", ...uniqueCategories]);

    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = selectedCategory === "All" || course.category === selectedCategory;
    const matchesLevel = selectedLevel === "All Levels" || course.difficulty_level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  return (
    <>
      <SeoHead
        title="Online Marketing Courses | ShreeAds"
        description="Browse and enroll in online marketing courses at ShreeAds. Learn digital marketing, SEO, social media, and more with expert-led courses and certificates."
      />
      {/* Promo Code Banner - Only for logged in users */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-primary via-purple-600 to-pink-500 border-0 text-white overflow-hidden relative">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Ticket className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">Have a Promo Code?</h3>
                  <p className="text-sm opacity-90">Enter your code to enroll in a course instantly</p>
                </div>
              </div>
              <Button 
                className="bg-white text-primary hover:bg-white/90 shadow-lg"
                onClick={() => setShowPromoDialog(true)}
              >
                <Gift className="w-4 h-4" />
                Redeem Code
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 h-12 rounded-xl"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
          <div className="flex-shrink-0 sm:ml-auto">
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <p className="text-muted-foreground mb-6">
            Showing {filteredCourses.length} courses
          </p>

          {filteredCourses.length > 0 ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={`/course/${course.id}`} className="block group">
                    <div className="h-full rounded-2xl border border-border/50 bg-card shadow-[0_4px_20px_-2px_rgb(0_0_0_/_0.08)] overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                      <div className="relative aspect-video bg-secondary overflow-hidden">
                        {course.thumbnail_url ? (
                          <img 
                            src={course.thumbnail_url} 
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-primary/40" />
                          </div>
                        )}
                        {course.difficulty_level && (
                          <div className="absolute top-3 right-3">
                            <Badge variant={levelColors[course.difficulty_level] || "secondary"}>
                              {course.difficulty_level}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        {course.category && (
                          <Badge variant="secondary" className="text-xs mb-2">
                            {course.category}
                          </Badge>
                        )}
                        <h3 className="font-display text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {course.title}
                        </h3>
                        {course.description && (
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                            {course.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {course.lesson_count} lessons
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <CoursePriceDisplay
                            courseId={course.id}
                            price={course.price}
                            discountPrice={course.discount_price}
                            isFree={course.is_free}
                            size="sm"
                          />
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">{course.enrollment_count.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              {courses.length === 0 ? (
                <>
                  <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Courses Available Yet</h3>
                  <p className="text-muted-foreground">
                    Check back soon! New courses are being added regularly.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground text-lg">No courses found matching your criteria.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All");
                      setSelectedLevel("All Levels");
                    }}
                  >
                    Clear Filters
                  </Button>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Promo Code Dialog */}
      <Dialog open={showPromoDialog} onOpenChange={setShowPromoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Promo Code</DialogTitle>
            <DialogDescription>
              Enter your promo code to enroll in a course
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter promo code"
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
              className="font-mono text-lg"
              disabled={isRedeeming}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPromoDialog(false)} disabled={isRedeeming}>
              Cancel
            </Button>
            <Button onClick={handleRedeemCode} disabled={isRedeeming || !promoCodeInput.trim()}>
              {isRedeeming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redeeming...
                </>
              ) : (
                'Redeem'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const Courses = () => {
  const { user } = useAuth();

  // If user is logged in, use dashboard layout
  if (user) {
    return (
      <DashboardLayout 
        title="Browse Courses" 
        subtitle="Discover courses designed to help you achieve your career goals"
      >
        <PromotionalBanner variant="full" className="mb-8 rounded-2xl overflow-hidden" />
        <CoursesContent user={user} />
      </DashboardLayout>
    );
  }

  // Public layout for non-logged-in users
  return (
    <div className="min-h-screen bg-background">
      <PromotionalBanner variant="compact" />
      <Header />
      <main className="pt-20 lg:pt-24 pb-16">
        <div className="container mx-auto px-4">
          <PromotionalBanner variant="full" className="mb-8 rounded-2xl overflow-hidden" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Browse Courses</h1>
            <p className="text-muted-foreground">
              Discover courses designed to help you achieve your career goals
            </p>
          </motion.div>
          
          {/* Sign up CTA for guests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-primary to-purple-600 border-0 text-white">
              <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-lg">Ready to start learning?</h3>
                  <p className="text-sm opacity-90">Create an account to enroll in courses and track your progress</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10" asChild>
                    <Link to="/login">Start Learning Free</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <CoursesContent user={null} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Courses;
