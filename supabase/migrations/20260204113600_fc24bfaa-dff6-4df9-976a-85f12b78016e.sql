-- Create table to link promotions with software products (similar to promotion_courses)
CREATE TABLE IF NOT EXISTS public.promotion_software (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.software_products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(promotion_id, product_id)
);

-- Enable RLS
ALTER TABLE public.promotion_software ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage promotion software"
ON public.promotion_software
FOR ALL
USING (is_admin());

CREATE POLICY "Anyone can view promotion software"
ON public.promotion_software
FOR SELECT
USING (true);

-- Create function to get active promotion for software
CREATE OR REPLACE FUNCTION public.get_active_promotion_for_software(_product_id UUID)
RETURNS TABLE (
    promotion_id UUID,
    promotion_name TEXT,
    discount_percentage INTEGER,
    end_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        p.id,
        p.name,
        p.discount_percentage,
        p.end_date
    FROM public.promotions p
    JOIN public.promotion_software ps ON ps.promotion_id = p.id
    WHERE ps.product_id = _product_id
      AND p.is_active = true
      AND p.start_date <= now()
      AND p.end_date >= now()
    ORDER BY p.discount_percentage DESC
    LIMIT 1;
$$;