import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  List, 
  X, 
  CheckCircle,
  Play,
  Clock,
  BookOpen,
  Award,
  Lock as LockIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLessonProgress, useCourseProgress } from '@/hooks/useLessonProgress';
import CourseCompletionModal from '@/components/course/CourseCompletionModal';

interface Course {
  id: string;
  title: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_seconds: number;
  order_index: number;
  is_preview: boolean;
}

interface LessonProgressData {
  lesson_id: string;
  is_completed: boolean;
  watched_seconds: number;
}

const CourseLesson = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [lessonsProgress, setLessonsProgress] = useState<LessonProgressData[]>([]);
  const [initialProgress, setInitialProgress] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(true);
  const [previewLessonLimit, setPreviewLessonLimit] = useState(1);
  const [previewSecondsLimit, setPreviewSecondsLimit] = useState(300);
  // Content Protection Agreement bypassed so users can start video/course immediately
  const [termsAccepted] = useState(true);
  
  const { updateProgress, getProgress } = useLessonProgress(lessonId || '');
  const { getCourseProgress } = useCourseProgress(courseId || '');
  const [courseProgress, setCourseProgress] = useState<{ completedCount: number; totalCount: number; percentage: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId || !lessonId) return;

      setIsLoading(true);
      try {
        // Fetch course
        const { data: courseData } = await supabase
          .from('courses')
          .select('id, title, preview_lesson_limit, preview_seconds_limit')
          .eq('id', courseId)
          .maybeSingle();

        setCourse(courseData);
        setPreviewLessonLimit((courseData as any)?.preview_lesson_limit ?? 1);
        setPreviewSecondsLimit((courseData as any)?.preview_seconds_limit ?? 300);

        // Enrollment check (drives free-preview gating)
        if (user) {
          const { data: enrollment } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .maybeSingle();
          setIsEnrolled(!!enrollment);
        } else {
          setIsEnrolled(false);
        }

        // Fetch all lessons
        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index');

        setLessons(lessonsData || []);

        // Find current lesson
        const lesson = lessonsData?.find(l => l.id === lessonId);
        setCurrentLesson(lesson || null);

        // Fetch progress for all lessons
        if (user && lessonsData) {
          const { data: progressData } = await supabase
            .from('lesson_progress')
            .select('lesson_id, is_completed, watched_seconds')
            .eq('user_id', user.id)
            .in('lesson_id', lessonsData.map(l => l.id));

          setLessonsProgress(progressData || []);

          // Get current lesson progress
          const currentProgress = progressData?.find(p => p.lesson_id === lessonId);
          if (currentProgress) {
            setInitialProgress(currentProgress.watched_seconds);
          }

          // Get course progress
          const progress = await getCourseProgress();
          setCourseProgress(progress);
        }
      } catch (error) {
        console.error('Error fetching lesson data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [courseId, lessonId, user, getCourseProgress]);

  const handleProgressUpdate = useCallback(async (watchedSeconds: number, isCompleted: boolean) => {
    await updateProgress(watchedSeconds, isCompleted);
    
    // Update local state
    setLessonsProgress(prev => {
      const existing = prev.find(p => p.lesson_id === lessonId);
      if (existing) {
        return prev.map(p => 
          p.lesson_id === lessonId 
            ? { ...p, watched_seconds: watchedSeconds, is_completed: isCompleted }
            : p
        );
      }
      return [...prev, { lesson_id: lessonId!, watched_seconds: watchedSeconds, is_completed: isCompleted }];
    });

    if (isCompleted) {
      const progress = await getCourseProgress();
      setCourseProgress(progress);
    }
  }, [lessonId, updateProgress, getCourseProgress]);

  const handleLessonChange = (newLessonId: string) => {
    navigate(`/course/${courseId}/lesson/${newLessonId}`);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const getLessonProgress = (lessonId: string) => {
    return lessonsProgress.find(p => p.lesson_id === lessonId);
  };

  const currentIndex = lessons.findIndex(l => l.id === lessonId);

  // Free preview gating for non-enrolled visitors
  const allowedPreviewLessonIds = lessons
    .filter(l => l.is_preview)
    .slice(0, Math.max(0, previewLessonLimit))
    .map(l => l.id);
  const isPreviewMode = !isEnrolled;
  const previewLocked = isPreviewMode && !allowedPreviewLessonIds.includes(lessonId || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentLesson || !course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Lesson Not Found</h1>
          <Button onClick={() => navigate(`/course/${courseId}`)}>
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-16 border-b bg-card flex items-center px-4 gap-4 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/course/${courseId}`)}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{course.title}</p>
          <h1 className="font-medium truncate">{currentLesson.title}</h1>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSidebar(!showSidebar)}
          className="lg:hidden"
        >
          {showSidebar ? <X className="w-5 h-5" /> : <List className="w-5 h-5" />}
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video Player */}
          <div className="p-4 lg:p-6" data-sensitive="true">
            {previewLocked ? (
              <div className="aspect-video w-full rounded-lg bg-muted flex flex-col items-center justify-center text-center p-6">
                <LockIcon className="w-8 h-8 text-muted-foreground mb-3" />
                <h2 className="font-semibold mb-1">This lesson is locked</h2>
                <p className="text-sm text-muted-foreground max-w-sm mb-4">
                  {allowedPreviewLessonIds.length > 0
                    ? `Only ${allowedPreviewLessonIds.length} free preview lesson${allowedPreviewLessonIds.length > 1 ? 's are' : ' is'} available. Enroll to unlock the full course.`
                    : 'Enroll in this course to start watching.'}
                </p>
                <Button onClick={() => navigate(`/course/${courseId}`)}>Enroll Now</Button>
              </div>
            ) : (
              <VideoPlayer
                lesson={currentLesson}
                lessons={lessons}
                initialProgress={isPreviewMode ? 0 : initialProgress}
                onProgressUpdate={handleProgressUpdate}
                onLessonChange={handleLessonChange}
                userEmail={profile?.email}
                previewLimitSeconds={isPreviewMode ? previewSecondsLimit : null}
              />
            )}
          </div>


          {/* Lesson Info */}
          <div className="p-4 lg:p-6 pt-0 flex-1 overflow-auto">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                <span>Lesson {currentIndex + 1} of {lessons.length}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(currentLesson.duration_seconds)}</span>
              </div>
            </div>

            <h2 className="text-2xl font-display font-bold mb-4">
              {currentLesson.title}
            </h2>

            {currentLesson.description && (
              <p className="text-muted-foreground">
                {currentLesson.description}
              </p>
            )}

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8 pt-6 border-t">
              <Button
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => handleLessonChange(lessons[currentIndex - 1].id)}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous Lesson
              </Button>

              {currentIndex === lessons.length - 1 ? (
                <Button
                  onClick={() => setShowCompletionModal(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  <Award className="w-4 h-4 mr-2" />
                  Download Certificate
                </Button>
              ) : (
                <Button
                  onClick={() => handleLessonChange(lessons[currentIndex + 1].id)}
                >
                  Next Lesson
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ 
            width: showSidebar ? 320 : 0,
            opacity: showSidebar ? 1 : 0 
          }}
          className="border-l bg-card overflow-hidden shrink-0 hidden lg:block"
        >
          <div className="w-80 h-full flex flex-col">
            {/* Progress */}
            {courseProgress && (
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Course Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {courseProgress.percentage}%
                  </span>
                </div>
                <Progress value={courseProgress.percentage} className="h-2" />
              </div>
            )}

            {/* Lesson List */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {lessons.map((lesson, index) => {
                  const progress = getLessonProgress(lesson.id);
                  const isCurrent = lesson.id === lessonId;
                  const isCompleted = progress?.is_completed;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => handleLessonChange(lesson.id)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        isCurrent 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isCompleted 
                            ? 'bg-green-500 text-white' 
                            : isCurrent 
                              ? 'bg-primary text-white' 
                              : 'bg-muted text-muted-foreground'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <span className="text-xs font-medium">{index + 1}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            isCurrent ? 'text-primary' : ''
                          }`}>
                            {lesson.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDuration(lesson.duration_seconds)}
                          </p>
                          
                          {progress && !isCompleted && progress.watched_seconds > 0 && (
                            <Progress 
                              value={(progress.watched_seconds / lesson.duration_seconds) * 100} 
                              className="h-1 mt-2"
                            />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </motion.aside>

        {/* Mobile Sidebar Overlay */}
        {showSidebar && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}
        {/* Mobile Sidebar */}
        {showSidebar && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-y-0 right-0 w-[85vw] max-w-80 bg-card border-l z-50 lg:hidden"
          >
            <div className="h-16 border-b flex items-center justify-between px-4">
              <span className="font-medium">Course Content</span>
              <Button variant="ghost" size="icon" onClick={() => setShowSidebar(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <ScrollArea className="h-[calc(100vh-4rem)]">
              <div className="p-2">
                {lessons.map((lesson, index) => {
                  const progress = getLessonProgress(lesson.id);
                  const isCurrent = lesson.id === lessonId;
                  const isCompleted = progress?.is_completed;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => {
                        handleLessonChange(lesson.id);
                        setShowSidebar(false);
                      }}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        isCurrent 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isCompleted 
                            ? 'bg-green-500 text-white' 
                            : isCurrent 
                              ? 'bg-primary text-white' 
                              : 'bg-muted text-muted-foreground'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <span className="text-xs font-medium">{index + 1}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            isCurrent ? 'text-primary' : ''
                          }`}>
                            {lesson.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDuration(lesson.duration_seconds)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </div>

      {/* Course Completion Modal */}
      <CourseCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        courseName={course?.title || ''}
        courseId={courseId || ''}
      />
    </div>
  );
};

export default CourseLesson;
