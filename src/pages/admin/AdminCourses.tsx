import { useState, useEffect, useCallback } from 'react';
import { MobileDataCard, MobileCardList } from '@/components/admin/MobileDataCard';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  BookOpen,
  Users,
  Clock,
  Copy,
  GraduationCap,
  Upload,
  Video,
  Youtube,
  Link,
  AlertCircle,
  GripVertical,
  Percent,
  XCircle,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { validateVideoUrl, isValidYouTubeUrl, getYouTubeThumbnailUrl } from '@/lib/youtube';
import { generateVideoThumbnail, getVideoDuration } from '@/lib/video-utils';
import { getDisplayPrice } from '@/lib/price-utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  difficulty_level: string | null;
  is_published: boolean;
  created_at: string;
  price: number | null;
  discount_price: number | null;
  is_free: boolean | null;
  _count?: { lessons: number; enrollments: number };
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_seconds: number;
  order_index: number;
  is_preview: boolean;
  completion_percentage?: number;
}

// Sortable Lesson Item Component
function SortableLessonItem({
  lesson,
  index,
  onEdit,
  onDelete,
}: {
  lesson: Lesson;
  index: number;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  const completionPct = lesson.completion_percentage ?? 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-secondary/50 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-secondary rounded touch-none"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>

      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm shrink-0">
        {index + 1}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm truncate">{lesson.title}</p>
          {lesson.video_url && isValidYouTubeUrl(lesson.video_url) && (
            <Badge variant="outline" className="text-xs text-red-500 border-red-200">
              <Youtube className="w-3 h-3 mr-1" /> YT
            </Badge>
          )}
          {lesson.is_preview && (
            <Badge variant="secondary" className="text-xs">Preview</Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-xs text-muted-foreground">
            {Math.floor(lesson.duration_seconds / 60)} min
          </p>
          <div className="flex items-center gap-1.5 flex-1 max-w-[120px]">
            <Progress value={completionPct} className="h-1.5" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {completionPct.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex gap-1 shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => onEdit(lesson)}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-destructive"
          onClick={() => onDelete(lesson.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

const AdminCourses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showLessonsDialog, setShowLessonsDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  
  // Individual form state (prevents focus loss)
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDifficulty, setFormDifficulty] = useState('beginner');
  const [formThumbnail, setFormThumbnail] = useState('');
  const [formIsPublished, setFormIsPublished] = useState(false);
  const [formPrice, setFormPrice] = useState('');
  const [formDiscountPrice, setFormDiscountPrice] = useState('');
  const [formIsFree, setFormIsFree] = useState(true);

  // Lesson form state
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonDuration, setLessonDuration] = useState(0);
  const [lessonIsPreview, setLessonIsPreview] = useState(false);

  const [videoUrlError, setVideoUrlError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const coursesWithCounts = await Promise.all(
        (data || []).map(async (course) => {
          const [lessonsRes, enrollmentsRes] = await Promise.all([
            supabase.from('lessons').select('id', { count: 'exact' }).eq('course_id', course.id),
            supabase.from('enrollments').select('id', { count: 'exact' }).eq('course_id', course.id),
          ]);
          
          return {
            ...course,
            _count: {
              lessons: lessonsRes.count || 0,
              enrollments: enrollmentsRes.count || 0,
            },
          };
        })
      );

      setCourses(coursesWithCounts);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({ title: 'Error', description: 'Failed to fetch courses', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetCourseForm = useCallback(() => {
    setFormTitle('');
    setFormDescription('');
    setFormCategory('');
    setFormDifficulty('beginner');
    setFormThumbnail('');
    setFormIsPublished(false);
    setFormPrice('');
    setFormDiscountPrice('');
    setFormIsFree(true);
  }, []);

  const loadCourseForm = useCallback((course: Course) => {
    setFormTitle(course.title || '');
    setFormDescription(course.description || '');
    setFormCategory(course.category || '');
    setFormDifficulty(course.difficulty_level || 'beginner');
    setFormThumbnail(course.thumbnail_url || '');
    setFormIsPublished(course.is_published);
    setFormPrice(course.price?.toString() || '');
    setFormDiscountPrice(course.discount_price?.toString() || '');
    setFormIsFree(course.is_free ?? true);
  }, []);

  const resetLessonForm = useCallback(() => {
    setLessonTitle('');
    setLessonDescription('');
    setLessonVideoUrl('');
    setLessonDuration(0);
    setLessonIsPreview(false);
    setVideoUrlError(null);
    setVideoThumbnail(null);
  }, []);

  const handleSaveCourse = async () => {
    const courseData = {
      title: formTitle,
      description: formDescription,
      category: formCategory,
      difficulty_level: formDifficulty,
      thumbnail_url: formThumbnail || null,
      is_published: formIsPublished,
      price: formIsFree ? 0 : parseFloat(formPrice) || 0,
      discount_price: formDiscountPrice ? parseFloat(formDiscountPrice) : null,
      is_free: formIsFree,
    };

    try {
      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update({ ...courseData, updated_at: new Date().toISOString() })
          .eq('id', editingCourse.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Course updated successfully' });
      } else {
        const { error } = await supabase
          .from('courses')
          .insert({ ...courseData, created_by: user?.id });
        if (error) throw error;
        toast({ title: 'Success', description: 'Course created successfully' });
      }

      setShowCourseDialog(false);
      setEditingCourse(null);
      resetCourseForm();
      fetchCourses();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This will also delete all lessons and enrollments.')) return;
    try {
      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) throw error;
      toast({ title: 'Success', description: 'Course deleted successfully' });
      fetchCourses();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDuplicateCourse = async (course: Course) => {
    try {
      const { data: newCourse, error } = await supabase
        .from('courses')
        .insert({
          title: `${course.title} (Copy)`,
          description: course.description,
          thumbnail_url: course.thumbnail_url,
          category: course.category,
          difficulty_level: course.difficulty_level,
          is_published: false,
          created_by: user?.id,
          price: course.price,
          discount_price: course.discount_price,
          is_free: course.is_free,
        })
        .select()
        .single();

      if (error) throw error;

      const { data: originalLessons } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', course.id);

      if (originalLessons && originalLessons.length > 0) {
        await supabase.from('lessons').insert(
          originalLessons.map(lesson => ({
            course_id: newCourse.id,
            title: lesson.title,
            description: lesson.description,
            video_url: lesson.video_url,
            duration_seconds: lesson.duration_seconds,
            order_index: lesson.order_index,
            is_preview: lesson.is_preview,
          }))
        );
      }

      toast({ title: 'Success', description: 'Course duplicated successfully' });
      fetchCourses();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const openEditCourse = (course: Course) => {
    setEditingCourse(course);
    loadCourseForm(course);
    setShowCourseDialog(true);
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = lessons.findIndex(l => l.id === active.id);
      const newIndex = lessons.findIndex(l => l.id === over.id);
      const newLessons = arrayMove(lessons, oldIndex, newIndex);
      setLessons(newLessons);
      try {
        await Promise.all(
          newLessons.map((lesson, index) =>
            supabase.from('lessons').update({ order_index: index }).eq('id', lesson.id)
          )
        );
        toast({ title: 'Success', description: 'Lesson order updated' });
      } catch {
        toast({ title: 'Error', description: 'Failed to update lesson order', variant: 'destructive' });
        const { data } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', selectedCourse?.id)
          .order('order_index');
        setLessons(data || []);
      }
    }
  };

  const openLessonsDialog = async (course: Course) => {
    setSelectedCourse(course);
    try {
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', course.id)
        .order('order_index');

      if (lessonsError) throw lessonsError;
      const lessonsList = lessonsData || [];
      
      if (lessonsList.length > 0) {
        const lessonIds = lessonsList.map(l => l.id);
        const { data: progressData } = await supabase
          .from('lesson_progress')
          .select('lesson_id, is_completed')
          .in('lesson_id', lessonIds);
        
        const { count: totalEnrolled } = await supabase
          .from('enrollments')
          .select('id', { count: 'exact' })
          .eq('course_id', course.id);
        
        const lessonsWithCompletion = lessonsList.map(lesson => {
          const lessonProgress = progressData?.filter(p => p.lesson_id === lesson.id) || [];
          const completedCount = lessonProgress.filter(p => p.is_completed).length;
          const completion_percentage = totalEnrolled && totalEnrolled > 0
            ? (completedCount / totalEnrolled) * 100 : 0;
          return { ...lesson, completion_percentage };
        });
        setLessons(lessonsWithCompletion);
      } else {
        setLessons([]);
      }
      setShowLessonsDialog(true);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const handleVideoUrlChange = (url: string) => {
    setLessonVideoUrl(url);
    const error = validateVideoUrl(url);
    setVideoUrlError(error);
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload a video file (MP4, WebM, OGG, or MOV)', variant: 'destructive' });
      return;
    }

    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: 'File too large', description: 'Maximum file size is 500MB', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const [thumbnailBlob, videoDuration] = await Promise.all([
        generateVideoThumbnail(file, 2).catch(() => null),
        getVideoDuration(file).catch(() => 0)
      ]);

      if (thumbnailBlob) {
        const thumbnailUrl = URL.createObjectURL(thumbnailBlob);
        setVideoThumbnail(thumbnailUrl);
      }

      if (videoDuration > 0) {
        setLessonDuration(videoDuration);
      }

      setUploadProgress(20);

      const fileExt = file.name.split('.').pop();
      const baseName = `${selectedCourse?.id || 'lesson'}/${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const fileName = `${baseName}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('course-videos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      setUploadProgress(80);

      if (thumbnailBlob) {
        const thumbnailFileName = `${baseName}-thumb.jpg`;
        await supabase.storage
          .from('course-videos')
          .upload(thumbnailFileName, thumbnailBlob, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' });
      }

      setUploadProgress(100);

      const { data: urlData } = supabase.storage.from('course-videos').getPublicUrl(data.path);
      setLessonVideoUrl(urlData.publicUrl);
      setVideoUrlError(null);
      
      toast({ title: 'Success', description: 'Video uploaded with thumbnail generated' });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', description: error.message || 'Failed to upload video', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSaveLesson = async () => {
    if (!selectedCourse) return;

    const urlError = validateVideoUrl(lessonVideoUrl);
    if (urlError) {
      setVideoUrlError(urlError);
      toast({ title: 'Validation Error', description: urlError, variant: 'destructive' });
      return;
    }

    const lessonData = {
      title: lessonTitle,
      description: lessonDescription,
      video_url: lessonVideoUrl,
      duration_seconds: lessonDuration,
      is_preview: lessonIsPreview,
    };

    try {
      if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update({ ...lessonData, updated_at: new Date().toISOString() })
          .eq('id', editingLesson.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Lesson updated successfully' });
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert({ ...lessonData, course_id: selectedCourse.id, order_index: lessons.length });
        if (error) throw error;
        toast({ title: 'Success', description: 'Lesson created successfully' });
      }

      setShowLessonDialog(false);
      setEditingLesson(null);
      resetLessonForm();
      
      const { data } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', selectedCourse.id)
        .order('order_index');
      setLessons(data || []);
      fetchCourses();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    try {
      const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
      if (error) throw error;
      setLessons(lessons.filter(l => l.id !== lessonId));
      toast({ title: 'Success', description: 'Lesson deleted successfully' });
      fetchCourses();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const openEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonTitle(lesson.title);
    setLessonDescription(lesson.description || '');
    setLessonVideoUrl(lesson.video_url || '');
    setLessonDuration(lesson.duration_seconds);
    setLessonIsPreview(lesson.is_preview);
    setVideoThumbnail(null);
    setShowLessonDialog(true);
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const priceNum = parseFloat(formPrice) || 0;
  const discountNum = parseFloat(formDiscountPrice) || 0;

  const courseFormContent = (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div>
        <Label htmlFor="form-title">Title *</Label>
        <Input
          id="form-title"
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
          placeholder="Course title"
        />
      </div>

      <div>
        <Label htmlFor="form-description">Description</Label>
        <Textarea
          id="form-description"
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          placeholder="Course description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="form-category">Category</Label>
          <Input
            id="form-category"
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
            placeholder="e.g., Marketing"
          />
        </div>
        <div>
          <Label htmlFor="form-difficulty">Difficulty</Label>
          <Select value={formDifficulty} onValueChange={setFormDifficulty}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="form-thumbnail">Thumbnail URL</Label>
        <Input
          id="form-thumbnail"
          value={formThumbnail}
          onChange={(e) => setFormThumbnail(e.target.value)}
          placeholder="https://..."
        />
      </div>

      {/* Pricing Section */}
      <div className="space-y-4 p-4 rounded-lg border bg-secondary/30">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="form-is-free" className="text-base font-medium">Free Course</Label>
            <p className="text-sm text-muted-foreground">Toggle off to set a price</p>
          </div>
          <Switch
            id="form-is-free"
            checked={formIsFree}
            onCheckedChange={(checked) => {
              setFormIsFree(checked);
              if (checked) {
                setFormPrice('');
                setFormDiscountPrice('');
              }
            }}
          />
        </div>

        {!formIsFree && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <Label htmlFor="form-price">Price (₹) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input
                  id="form-price"
                  type="number"
                  min="0"
                  step="1"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="999"
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="form-discount-price">Discount Price (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input
                  id="form-discount-price"
                  type="number"
                  min="0"
                  step="1"
                  value={formDiscountPrice}
                  onChange={(e) => setFormDiscountPrice(e.target.value)}
                  placeholder="499"
                  className="pl-8"
                />
              </div>
              {discountNum > 0 && priceNum > 0 && discountNum < priceNum && (
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <Percent className="w-3 h-3" />
                  {Math.round(((priceNum - discountNum) / priceNum) * 100)}% off
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="form-is-published"
            checked={formIsPublished}
            onCheckedChange={setFormIsPublished}
          />
          <Label htmlFor="form-is-published">Published</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background pb-2">
        <Button variant="outline" onClick={() => {
          setShowCourseDialog(false);
          setEditingCourse(null);
          resetCourseForm();
        }}>
          Cancel
        </Button>
        <Button onClick={handleSaveCourse} disabled={!formTitle.trim()}>
          {editingCourse ? 'Save Changes' : 'Create Course'}
        </Button>
      </div>
    </div>
  );

  return (
    <AdminLayout 
      title="Courses" 
      subtitle="Manage your courses and lessons"
      actions={
        <Button 
          variant="hero" 
          size="sm"
          onClick={() => {
            resetCourseForm();
            setEditingCourse(null);
            setShowCourseDialog(true);
          }}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline ml-2">New Course</span>
        </Button>
      }
    >
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Courses Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="p-16 text-center">
              <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-bold text-lg mb-2">No Courses Yet</h3>
              <p className="text-muted-foreground mb-4">Create your first course to get started</p>
              <Button onClick={() => setShowCourseDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            </div>
          ) : (
            <>
            <MobileCardList>
              {filteredCourses.map((course) => {
                const priceInfo = getDisplayPrice(course.price, course.discount_price, course.is_free);
                return (
                  <MobileDataCard
                    key={course.id}
                    fields={[
                      { label: 'Course', value: <span className="font-medium">{course.title}</span> },
                      { label: 'Category', value: course.category || '—' },
                      { label: 'Lessons', value: course._count?.lessons || 0 },
                      { label: 'Students', value: course._count?.enrollments || 0 },
                      { label: 'Price', value: <span>{priceInfo.current}{priceInfo.original && <span className="text-xs text-muted-foreground line-through ml-1">{priceInfo.original}</span>}</span> },
                      { label: 'Status', value: course.is_published ? <Badge className="bg-green-500/10 text-green-500">Published</Badge> : <Badge variant="secondary">Draft</Badge> },
                    ]}
                    actions={
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openLessonsDialog(course)}><Video className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCourse(course)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicateCourse(course)}><Copy className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteCourse(course.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </>
                    }
                  />
                );
              })}
            </MobileCardList>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Lessons</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center shrink-0">
                            {course.thumbnail_url ? (
                              <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover rounded" />
                            ) : (
                              <GraduationCap className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[200px]">{course.title}</p>
                            <p className="text-xs text-muted-foreground">{course._count?.enrollments || 0} students</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{course.category ? <Badge variant="secondary">{course.category}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell><div className="flex items-center gap-1"><Video className="w-3 h-3 text-muted-foreground" /><span className="text-sm">{course._count?.lessons || 0}</span></div></TableCell>
                      <TableCell>
                        {(() => {
                          const priceInfo = getDisplayPrice(course.price, course.discount_price, course.is_free);
                          return (
                            <div className="flex items-center gap-1">
                              <span className={priceInfo.current === 'Free' ? 'text-green-600 font-medium' : ''}>{priceInfo.current}</span>
                              {priceInfo.original && <span className="text-xs text-muted-foreground line-through">{priceInfo.original}</span>}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {course.is_published ? (
                          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20"><Eye className="w-3 h-3 mr-1" /> Published</Badge>
                        ) : (
                          <Badge variant="secondary"><EyeOff className="w-3 h-3 mr-1" /> Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openLessonsDialog(course)} title="Manage lessons"><Video className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditCourse(course)} title="Edit course"><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDuplicateCourse(course)} title="Duplicate course"><Copy className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteCourse(course.id)} title="Delete course"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Course Dialog */}
      <Dialog open={showCourseDialog} onOpenChange={(open) => {
        setShowCourseDialog(open);
        if (open && !editingCourse) resetCourseForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Edit Course' : 'Create Course'}</DialogTitle>
          </DialogHeader>
          {courseFormContent}
        </DialogContent>
      </Dialog>

      {/* Lessons Dialog */}
      <Dialog open={showLessonsDialog} onOpenChange={setShowLessonsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Lessons</DialogTitle>
            <DialogDescription>
              {selectedCourse?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Button 
              size="sm" 
              className="mb-4"
              onClick={() => {
                resetLessonForm();
                setEditingLesson(null);
                setShowLessonDialog(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Lesson
            </Button>

            {lessons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No lessons yet. Add your first lesson.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={lessons.map(l => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {lessons.map((lesson, index) => (
                      <SortableLessonItem
                        key={lesson.id}
                        lesson={lesson}
                        index={index}
                        onEdit={openEditLesson}
                        onDelete={handleDeleteLesson}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <Label htmlFor="lessonTitle">Title *</Label>
              <Input
                id="lessonTitle"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="Lesson title"
              />
            </div>

            <div>
              <Label htmlFor="lessonDescription">Description</Label>
              <Textarea
                id="lessonDescription"
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                placeholder="Lesson description"
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                Video
                {lessonVideoUrl && isValidYouTubeUrl(lessonVideoUrl) && (
                  <span className="flex items-center gap-1 text-xs text-red-500">
                    <Youtube className="w-3 h-3" /> YouTube
                  </span>
                )}
                {lessonVideoUrl && !isValidYouTubeUrl(lessonVideoUrl) && !videoUrlError && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Video className="w-3 h-3" /> Uploaded/Direct
                  </span>
                )}
              </Label>

              {/* Upload Section */}
              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  id="videoUpload"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime"
                  onChange={handleVideoUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <label 
                  htmlFor="videoUpload" 
                  className={`cursor-pointer flex flex-col items-center gap-2 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {isUploading ? (
                    <>
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-muted-foreground">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm font-medium">Upload Video</span>
                      <span className="text-xs text-muted-foreground">MP4, WebM, OGG, MOV (max 500MB)</span>
                    </>
                  )}
                </label>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or paste URL</span>
                </div>
              </div>

              {/* URL Input */}
              <Input
                id="videoUrl"
                value={lessonVideoUrl}
                onChange={(e) => handleVideoUrlChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or direct video URL"
                className={videoUrlError ? 'border-destructive' : ''}
              />
              {videoUrlError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {videoUrlError}
                </p>
              )}
              
              {/* YouTube Preview Thumbnail */}
              {lessonVideoUrl && isValidYouTubeUrl(lessonVideoUrl) && (
                <div className="relative rounded-lg overflow-hidden border">
                  <img 
                    src={getYouTubeThumbnailUrl(lessonVideoUrl) || ''} 
                    alt="YouTube thumbnail"
                    className="w-full aspect-video object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                      <Youtube className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* Uploaded Video Preview */}
              {lessonVideoUrl && !isValidYouTubeUrl(lessonVideoUrl) && !videoUrlError && (
                <div className="relative rounded-lg overflow-hidden border bg-secondary/50">
                  {videoThumbnail ? (
                    <div className="aspect-video relative">
                      <img 
                        src={videoThumbnail} 
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                        {Math.floor(lessonDuration / 60)}:{String(lessonDuration % 60).padStart(2, '0')}
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video flex items-center justify-center">
                      <div className="text-center">
                        <Video className="w-12 h-12 text-primary mx-auto mb-2" />
                        <p className="text-sm font-medium">Video Ready</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px] mx-auto">
                          {lessonVideoUrl.split('/').pop()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={lessonDuration}
                onChange={(e) => setLessonDuration(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="preview">Free Preview</Label>
              <Switch
                id="preview"
                checked={lessonIsPreview}
                onCheckedChange={setLessonIsPreview}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background pb-2">
              <Button variant="outline" onClick={() => setShowLessonDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveLesson} disabled={!lessonTitle.trim()}>
                {editingLesson ? 'Save Changes' : 'Add Lesson'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCourses;
