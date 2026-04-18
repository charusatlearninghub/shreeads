CREATE TABLE public.certificate_fonts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  font_url TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.certificate_fonts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view certificate fonts"
  ON public.certificate_fonts FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage certificate fonts"
  ON public.certificate_fonts FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

INSERT INTO storage.buckets (id, name, public) VALUES ('certificate-fonts', 'certificate-fonts', true);

CREATE POLICY "Anyone can view certificate font files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificate-fonts');

CREATE POLICY "Admins can upload certificate font files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'certificate-fonts' AND is_admin());

CREATE POLICY "Admins can update certificate font files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'certificate-fonts' AND is_admin());

CREATE POLICY "Admins can delete certificate font files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'certificate-fonts' AND is_admin());