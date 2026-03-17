import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface LessonProgress {
  lesson_id: string;
  watched_seconds: number;
  is_completed: boolean;
  last_watched_at: string;
}

export function useLessonProgress(lessonId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const updateProgress = useCallback(async (watchedSeconds: number, isCompleted: boolean) => {
    if (!user || !lessonId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          watched_seconds: watchedSeconds,
          is_completed: isCompleted,
          last_watched_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,lesson_id',
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setIsSaving(false);
    }
  }, [user, lessonId]);

  const getProgress = useCallback(async (): Promise<LessonProgress | null> => {
    if (!user || !lessonId) return null;

    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching progress:', error);
      return null;
    }
  }, [user, lessonId]);

  return {
    updateProgress,
    getProgress,
    isSaving,
  };
}

export function useCourseProgress(courseId: string) {
  const { user } = useAuth();

  const getCourseProgress = useCallback(async () => {
    if (!user || !courseId) return null;

    try {
      // Get all lessons for the course
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId);

      if (lessonsError) throw lessonsError;

      if (!lessons || lessons.length === 0) {
        return { completedCount: 0, totalCount: 0, percentage: 0 };
      }

      // Get progress for all lessons
      const { data: progress, error: progressError } = await supabase
        .from('lesson_progress')
        .select('lesson_id, is_completed')
        .eq('user_id', user.id)
        .in('lesson_id', lessons.map(l => l.id));

      if (progressError) throw progressError;

      const completedCount = progress?.filter(p => p.is_completed).length || 0;
      const totalCount = lessons.length;
      const percentage = Math.round((completedCount / totalCount) * 100);

      return { completedCount, totalCount, percentage };
    } catch (error) {
      console.error('Error fetching course progress:', error);
      return null;
    }
  }, [user, courseId]);

  return { getCourseProgress };
}
