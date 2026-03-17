-- Drop the unique constraint that prevents multiple reviews per user per course
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_course_id_key;