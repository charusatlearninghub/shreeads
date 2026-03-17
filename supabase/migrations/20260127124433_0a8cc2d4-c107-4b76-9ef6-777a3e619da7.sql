-- Add pricing columns to courses table
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_price DECIMAL(10, 2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.courses.price IS 'Original price in INR';
COMMENT ON COLUMN public.courses.discount_price IS 'Discounted price in INR (if applicable)';
COMMENT ON COLUMN public.courses.is_free IS 'Whether the course is free';