-- Create enum for software platform types
CREATE TYPE public.software_platform AS ENUM ('android', 'windows', 'mac', 'linux');

-- Create enum for software file types
CREATE TYPE public.software_file_type AS ENUM ('apk', 'exe', 'msi', 'dmg', 'pkg', 'appimage', 'deb', 'rpm');

-- Create software products table
CREATE TABLE public.software_products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    thumbnail_url TEXT,
    category TEXT,
    price NUMERIC DEFAULT 0,
    discount_price NUMERIC,
    is_free BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create software versions table for version management
CREATE TABLE public.software_versions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.software_products(id) ON DELETE CASCADE,
    version_number TEXT NOT NULL,
    release_notes TEXT,
    platform software_platform NOT NULL,
    file_type software_file_type NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    is_latest BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(product_id, version_number, platform)
);

-- Create software purchases table
CREATE TABLE public.software_purchases (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    product_id UUID NOT NULL REFERENCES public.software_products(id) ON DELETE CASCADE,
    promo_code_id UUID REFERENCES public.promo_codes(id),
    payment_method TEXT, -- 'promo_code' or 'stripe'
    stripe_payment_id TEXT,
    amount_paid NUMERIC DEFAULT 0,
    purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- Create software download logs table
CREATE TABLE public.software_downloads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    purchase_id UUID NOT NULL REFERENCES public.software_purchases(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES public.software_versions(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT
);

-- Create software promo codes table (separate from course promo codes)
CREATE TABLE public.software_promo_codes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL,
    product_id UUID NOT NULL REFERENCES public.software_products(id) ON DELETE CASCADE,
    is_used BOOLEAN DEFAULT false,
    used_by UUID,
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(code)
);

-- Enable RLS on all tables
ALTER TABLE public.software_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_promo_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for software_products
CREATE POLICY "Anyone can view published software" ON public.software_products
    FOR SELECT USING (is_published = true OR is_admin());

CREATE POLICY "Admins can insert software" ON public.software_products
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update software" ON public.software_products
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete software" ON public.software_products
    FOR DELETE USING (is_admin());

-- RLS policies for software_versions
CREATE POLICY "Users can view versions of purchased or free software" ON public.software_versions
    FOR SELECT USING (
        is_admin() OR 
        EXISTS (
            SELECT 1 FROM public.software_products sp 
            WHERE sp.id = product_id AND sp.is_free = true AND sp.is_published = true
        ) OR
        EXISTS (
            SELECT 1 FROM public.software_purchases p 
            WHERE p.product_id = software_versions.product_id AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can insert versions" ON public.software_versions
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update versions" ON public.software_versions
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete versions" ON public.software_versions
    FOR DELETE USING (is_admin());

-- RLS policies for software_purchases
CREATE POLICY "Users can view own purchases" ON public.software_purchases
    FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can manage purchases" ON public.software_purchases
    FOR ALL USING (is_admin());

-- RLS policies for software_downloads
CREATE POLICY "Users can view own downloads" ON public.software_downloads
    FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can insert own downloads" ON public.software_downloads
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage downloads" ON public.software_downloads
    FOR ALL USING (is_admin());

-- RLS policies for software_promo_codes
CREATE POLICY "Only admins can view software promo codes" ON public.software_promo_codes
    FOR SELECT USING (is_admin());

CREATE POLICY "Only admins can manage software promo codes" ON public.software_promo_codes
    FOR ALL USING (is_admin());

-- Create function to check if user has purchased software
CREATE OR REPLACE FUNCTION public.has_purchased_software(_user_id UUID, _product_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.software_purchases
        WHERE user_id = _user_id
          AND product_id = _product_id
    )
$$;

-- Create trigger for updated_at on software_products
CREATE TRIGGER update_software_products_updated_at
    BEFORE UPDATE ON public.software_products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for software files
INSERT INTO storage.buckets (id, name, public) VALUES ('software-files', 'software-files', false);

-- Storage policies for software files (private bucket - controlled access)
CREATE POLICY "Admins can upload software files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'software-files' AND is_admin());

CREATE POLICY "Admins can update software files" ON storage.objects
    FOR UPDATE USING (bucket_id = 'software-files' AND is_admin());

CREATE POLICY "Admins can delete software files" ON storage.objects
    FOR DELETE USING (bucket_id = 'software-files' AND is_admin());

-- Users who purchased can download (checked via edge function for signed URLs)
CREATE POLICY "Admins can view software files" ON storage.objects
    FOR SELECT USING (bucket_id = 'software-files' AND is_admin());