import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CoursePriceDisplay } from "@/components/course/CoursePriceDisplay";

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

const levelColors: Record<string, string> = {
  Beginner: "success",
  beginner: "success",
  Intermediate: "warning",
  intermediate: "warning",
  Advanced: "destructive",
  advanced: "destructive",
};

export const CoursesPreview = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
          .order('created_at', { ascending: false })
          .limit(4);

        if (error) throw error;

        // Get counts for each course
        const coursesWithCounts = await Promise.all(
          (coursesData || []).map(async (course) => {
            const [lessonRes, enrollmentRes] = await Promise.all([
              supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('course_id', course.id),
              supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('course_id', course.id),
            ]);

            return {
              ...course,
              lesson_count: lessonRes.count || 0,
              enrollment_count: enrollmentRes.count || 0,
            };
          })
        );

        setCourses(coursesWithCounts);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <section className="py-20 lg:py-32 relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12"
        >
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Featured Courses
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Popular <span className="gradient-text">Courses</span>
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Explore our most popular courses designed to help you achieve your career goals.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/courses">
              View All Courses
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>

        {/* Courses Grid */}
        {/* Courses Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Courses Available Yet</h3>
            <p className="text-muted-foreground">
              Check back soon! New courses are being added regularly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={`/course/${course.id}`} className="block group">
                  <div className="course-card h-full">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-secondary overflow-hidden">
                      {course.thumbnail_url ? (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-primary/20 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-primary/40" />
                        </div>
                      )}
                      {course.difficulty_level && (
                        <div className="absolute top-3 right-3">
                          <Badge variant={levelColors[course.difficulty_level] as "success" | "warning" | "destructive" || "secondary"}>
                            {course.difficulty_level}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      {course.category && (
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {course.category}
                          </Badge>
                        </div>
                      )}
                      <h3 className="font-display text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {course.description}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {course.lesson_count} lessons
                        </span>
                      </div>

                      {/* Footer */}
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
        )}
      </div>
    </section>
  );
};
