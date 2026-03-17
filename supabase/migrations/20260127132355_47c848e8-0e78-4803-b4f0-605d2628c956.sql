-- Create promotions table for time-limited discount campaigns
CREATE TABLE public.promotions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    discount_percentage INTEGER NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Create junction table for promotion-course relationships
CREATE TABLE public.promotion_courses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(promotion_id, course_id)
);

-- Create price history table to track price changes
CREATE TABLE public.price_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    old_price NUMERIC,
    new_price NUMERIC,
    old_discount_price NUMERIC,
    new_discount_price NUMERIC,
    old_is_free BOOLEAN,
    new_is_free BOOLEAN,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    changed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on all new tables
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for promotions - admins can manage, anyone can view active promotions
CREATE POLICY "Admins can manage promotions" ON public.promotions
    FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view active promotions" ON public.promotions
    FOR SELECT USING (is_active = true AND start_date <= now() AND end_date >= now());

-- RLS policies for promotion_courses
CREATE POLICY "Admins can manage promotion courses" ON public.promotion_courses
    FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view promotion courses" ON public.promotion_courses
    FOR SELECT USING (true);

-- RLS policies for price_history - admins only
CREATE POLICY "Admins can manage price history" ON public.price_history
    FOR ALL USING (is_admin());

CREATE POLICY "Admins can view price history" ON public.price_history
    FOR SELECT USING (is_admin());

-- Create trigger function to track price changes
CREATE OR REPLACE FUNCTION public.track_price_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only track if price-related fields changed
    IF (OLD.price IS DISTINCT FROM NEW.price) OR 
       (OLD.discount_price IS DISTINCT FROM NEW.discount_price) OR
       (OLD.is_free IS DISTINCT FROM NEW.is_free) THEN
        INSERT INTO public.price_history (
            course_id, 
            old_price, 
            new_price, 
            old_discount_price, 
            new_discount_price,
            old_is_free,
            new_is_free,
            changed_by
        ) VALUES (
            NEW.id,
            OLD.price,
            NEW.price,
            OLD.discount_price,
            NEW.discount_price,
            OLD.is_free,
            NEW.is_free,
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger on courses table
CREATE TRIGGER track_course_price_changes
    AFTER UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION public.track_price_changes();

-- Create function to get active promotion for a course
CREATE OR REPLACE FUNCTION public.get_active_promotion_for_course(_course_id UUID)
RETURNS TABLE (
    promotion_id UUID,
    promotion_name TEXT,
    discount_percentage INTEGER,
    end_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        p.id,
        p.name,
        p.discount_percentage,
        p.end_date
    FROM public.promotions p
    JOIN public.promotion_courses pc ON pc.promotion_id = p.id
    WHERE pc.course_id = _course_id
      AND p.is_active = true
      AND p.start_date <= now()
      AND p.end_date >= now()
    ORDER BY p.discount_percentage DESC
    LIMIT 1;
$$;

-- Update trigger for updated_at on promotions
CREATE TRIGGER update_promotions_updated_at
    BEFORE UPDATE ON public.promotions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for promotions
ALTER PUBLICATION supabase_realtime ADD TABLE public.promotions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.promotion_courses;