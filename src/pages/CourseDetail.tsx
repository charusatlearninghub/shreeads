import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Play, 
  Clock, 
  BookOpen, 
  Award, 
  CheckCircle, 
  Lock, 
  ChevronRight,
  ArrowLeft,
  Ticket,
  Gift,
  Loader2,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCourseProgress } from '@/hooks/useLessonProgress';
import { usePromoCode } from '@/hooks/usePromoCode';
import { useAffiliateRefCapture, getStoredAffiliateRef } from '@/hooks/useAffiliateRef';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CourseReviewForm } from '@/components/course/CourseReviewForm';
import { CourseReviews } from '@/components/course/CourseReviews';
import { CoursePriceDisplay } from '@/components/course/CoursePriceDisplay';
import { PromotionalBanner } from '@/components/promotions/PromotionalBanner';
import { LegalAgreementNote } from '@/components/common/LegalAgreementNote';

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  difficulty_level: string | null;
  is_published: boolean;
  price: number | null;
  discount_price: number | null;
  is_free: boolean | null;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  duration_seconds: number;
  order_index: number;
  is_preview: boolean;
}

interface LessonProgress {
  lesson_id: string;
  is_completed: boolean;
  watched_seconds: number;
}

const CourseDetail = () => {
  useAffiliateRefCapture();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { redeemPromoCode, isRedeeming } = usePromoCode();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [lessonsProgress, setLessonsProgress] = useState<LessonProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPromoDialog, setShowPromoDialog] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [inlinePromoCode, setInlinePromoCode] = useState('');
  const { getCourseProgress } = useCourseProgress(courseId || '');
  const [progress, setProgress] = useState<{ completedCount: number; totalCount: number; percentage: number } | null>(null);
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0);
  const storedRef = typeof window !== 'undefined' ? getStoredAffiliateRef() : null;

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;

      setIsLoading(true);
      try {
        // Fetch course
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .maybeSingle();

        if (courseError) throw courseError;
        setCourse(courseData);

        // Fetch lessons
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index');

        if (lessonsError) throw lessonsError;
        setLessons(lessonsData || []);

        // Check enrollment — free courses (price === 0 or is_free) grant access without enrollment
        const courseIsFree = courseData?.is_free === true || (courseData?.price != null && courseData.price === 0);
        if (user) {
          const { data: enrollmentData } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .maybeSingle();

          const enrolled = !!enrollmentData || !!courseIsFree;
          setIsEnrolled(enrolled);

          // Fetch progress if enrolled or course is free
          if ((enrollmentData || courseIsFree) && lessonsData) {
            const { data: progressData } = await supabase
              .from('lesson_progress')
              .select('lesson_id, is_completed, watched_seconds')
              .eq('user_id', user.id)
              .in('lesson_id', lessonsData.map(l => l.id));

            setLessonsProgress(progressData || []);

            // Calculate overall progress
            const courseProgress = await getCourseProgress();
            setProgress(courseProgress);
          }
        }
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, user, getCourseProgress]);

  const handleRedeemCode = async (codeOverride?: string) => {
    const code = (codeOverride ?? promoCodeInput).trim();
    if (!code) return;
    const result = await redeemPromoCode(code);
    if (result?.success) {
      setShowPromoDialog(false);
      setPromoCodeInput('');
      setInlinePromoCode('');
      setIsEnrolled(true);
      window.location.reload();
    }
  };

  const handleInlineRedeem = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/course/${courseId}` } });
      return;
    }
    await handleRedeemCode(inlinePromoCode);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
  };

  const totalDuration = lessons.reduce((acc, l) => acc + l.duration_seconds, 0);

  const getLessonProgress = (lessonId: string) => {
    return lessonsProgress.find(p => p.lesson_id === lessonId);
  };

  const handleLessonClick = (lesson: Lesson) => {
    const courseIsFree = course?.is_free === true || (course?.price != null && course.price === 0);
    if (isEnrolled || lesson.is_preview || courseIsFree) {
      navigate(`/course/${courseId}/lesson/${lesson.id}`);
    }
  };

  const getNextLesson = () => {
    // Find the first incomplete lesson
    for (const lesson of lessons) {
      const progress = getLessonProgress(lesson.id);
      if (!progress?.is_completed) {
        return lesson;
      }
    }
    return lessons[0];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-32 text-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <p className="text-muted-foreground mb-8">The course you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/courses')}>Browse Courses</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PromotionalBanner variant="compact" />
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-28 lg:pt-32 pb-8 sm:pb-12 lg:pb-16 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4">
          <Link 
            to="/courses" 
            className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Link>

          <div className="grid lg:grid-cols-3 gap-8" data-sensitive="true">
            {/* Course Info */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  {course.category && (
                    <Badge variant="secondary">{course.category}</Badge>
                  )}
                  {course.difficulty_level && (
                    <Badge variant="outline" className="capitalize">
                      {course.difficulty_level}
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold mb-4">
                  {course.title}
                </h1>

                <p className="text-lg text-muted-foreground mb-6">
                  {course.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <span>{lessons.length} Lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span>{formatDuration(totalDuration)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    <span>Certificate Included</span>
                  </div>
                </div>

                {isEnrolled && progress && (
                  <div className="mt-6 p-4 bg-card rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Your Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {progress.completedCount}/{progress.totalCount} lessons
                      </span>
                    </div>
                    <Progress value={progress.percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {progress.percentage}% complete
                    </p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Action Card */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="sticky top-24">
                  {course.thumbnail_url && (
                    <div className="aspect-video rounded-t-lg overflow-hidden">
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    {/* Price Display */}
                    {!isEnrolled && (
                      <div className="text-center mb-6 pb-6 border-b">
                        <CoursePriceDisplay
                          courseId={course.id}
                          price={course.price}
                          discountPrice={course.discount_price}
                          isFree={course.is_free}
                          size="lg"
                        />
                      </div>
                    )}

                    {isEnrolled ? (
                      <>
                        <Button 
                          variant="hero" 
                          size="lg" 
                          className="w-full mb-4"
                          onClick={() => {
                            const nextLesson = getNextLesson();
                            if (nextLesson) {
                              navigate(`/course/${courseId}/lesson/${nextLesson.id}`);
                            }
                          }}
                        >
                          <Play className="w-5 h-5 mr-2" />
                          Continue Learning
                        </Button>
                        <p className="text-center text-sm text-muted-foreground">
                          You're enrolled in this course
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Ticket className="w-8 h-8 text-primary" />
                          </div>
                          <p className="text-muted-foreground">
                            Enroll with a promo code
                          </p>
                        </div>
                        {user ? (
                          <Button 
                            variant="hero" 
                            size="lg" 
                            className="w-full"
                            onClick={() => setShowPromoDialog(true)}
                          >
                            <Gift className="w-5 h-5 mr-2" />
                            Enter Promo Code
                          </Button>
                        ) : (
                          <Button 
                            variant="hero" 
                            size="lg" 
                            className="w-full"
                            onClick={() => navigate('/login', { state: { from: `/course/${courseId}` } })}
                          >
                            Sign In to Enroll
                          </Button>
                        )}
                        
                        {/* WhatsApp Contact Button */}
                        <div className="mt-4">
                          <div className="relative flex items-center justify-center my-4">
                            <div className="border-t border-border flex-1"></div>
                            <span className="px-3 text-xs text-muted-foreground bg-card">or</span>
                            <div className="border-t border-border flex-1"></div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="lg" 
                            className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white border-0"
                            asChild
                          >
                            <a 
                              href={`https://wa.me/919265106657?text=${encodeURIComponent(`Hi, I am interested in the course: "${course.title}". Please share more details about enrollment.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageCircle className="w-5 h-5 mr-2" />
                              WhatsApp to Enroll
                            </a>
                          </Button>
                          <p className="text-xs text-muted-foreground text-center mt-2">
                            Contact admin for enrollment
                          </p>
                        </div>
                        <LegalAgreementNote className="mt-5 px-1" />
                      </>
                    )}

                    <div className="mt-6 pt-6 border-t space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span>Lifetime access</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span>Certificate of completion</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span>Mobile & desktop access</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-display font-bold mb-8">
            What's Included in This Course
          </h2>
          <p className="text-muted-foreground mb-8">
            {lessons.length} lessons • {formatDuration(totalDuration)} total
          </p>

          <div className="space-y-4">
            {lessons.map((lesson, index) => {
              const lessonProgress = getLessonProgress(lesson.id);
              const courseIsFree = course?.is_free === true || (course?.price != null && course.price === 0);
              const isAccessible = isEnrolled || lesson.is_preview || courseIsFree;
              const isCompleted = lessonProgress?.is_completed;

              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  {isEnrolled ? (
                    // Enrolled user view - clickable with progress
                    <Card 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isCompleted ? 'border-green-500/50 bg-green-500/5' : ''
                      }`}
                      onClick={() => handleLessonClick(lesson)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isCompleted 
                              ? 'bg-green-500 text-white' 
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </div>

                          <div className="flex-1">
                            <h3 className="font-medium">
                              {index + 1}. {lesson.title}
                            </h3>
                            {lesson.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {lesson.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                              {formatDuration(lesson.duration_seconds)}
                            </span>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>

                        {lessonProgress && !isCompleted && lessonProgress.watched_seconds > 0 && (
                          <div className="mt-3 ml-14">
                            <Progress 
                              value={(lessonProgress.watched_seconds / lesson.duration_seconds) * 100} 
                              className="h-1"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    // Non-enrolled user view - informational only
                    <Card className="transition-all hover:shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium shrink-0">
                            {index + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">
                                {lesson.title}
                              </h3>
                              {lesson.is_preview && (
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                  onClick={() => handleLessonClick(lesson)}
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  Preview
                                </Badge>
                              )}
                            </div>
                            {lesson.description && (
                              <p className="text-sm text-muted-foreground">
                                {lesson.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                            <Clock className="w-4 h-4" />
                            {formatDuration(lesson.duration_seconds)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Review Form for Enrolled Users */}
          {isEnrolled && course && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-12 max-w-2xl"
            >
              <CourseReviewForm 
                courseId={course.id} 
                courseTitle={course.title} 
                onReviewChange={() => setReviewRefreshTrigger(prev => prev + 1)}
              />
            </motion.div>
          )}

          {/* Course Reviews */}
          {course && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 max-w-2xl"
            >
              <CourseReviews 
                courseId={course.id} 
                refreshTrigger={reviewRefreshTrigger}
              />
            </motion.div>
          )}
        </div>
      </section>

      <Footer />

      {/* Promo Code Dialog */}
      <Dialog open={showPromoDialog} onOpenChange={setShowPromoDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <Ticket className="w-8 h-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center">Redeem Promo Code</DialogTitle>
            <DialogDescription className="text-center">
              Enter your promo code to enroll in <span className="font-semibold text-foreground">{course?.title}</span>
            </DialogDescription>
          </DialogHeader>
          {user ? (
            <>
              <div className="py-4">
                <Input
                  placeholder="Enter promo code"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                  className="font-mono text-lg text-center"
                  disabled={isRedeeming}
                />
              </div>
              <LegalAgreementNote className="mb-2 px-1" />
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setShowPromoDialog(false)} disabled={isRedeeming} className="w-full sm:w-auto">
                  Browse Course First
                </Button>
                <Button onClick={handleRedeemCode} disabled={isRedeeming || !promoCodeInput.trim()} className="w-full sm:w-auto">
                  {isRedeeming ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redeeming...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Redeem & Enroll
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="py-4 text-center">
                <p className="text-muted-foreground mb-4">
                  Please sign in to redeem your promo code and enroll in this course.
                </p>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setShowPromoDialog(false)} className="w-full sm:w-auto">
                  Browse Course First
                </Button>
                <Button onClick={() => navigate('/login', { state: { from: `/course/${courseId}` } })} className="w-full sm:w-auto">
                  Sign In to Continue
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseDetail;
