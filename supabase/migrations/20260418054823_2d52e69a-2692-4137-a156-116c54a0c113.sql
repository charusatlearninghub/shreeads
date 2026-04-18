-- Certificate templates table
CREATE TABLE public.certificate_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  template_url TEXT NOT NULL,
  organization_name TEXT NOT NULL DEFAULT 'SHREE ADS LEARNx',
  field_positions JSONB NOT NULL DEFAULT '{
    "student_name": {"x": 50, "y": 45, "fontSize": 36, "color": "#1a1a1a", "fontFamily": "Helvetica", "align": "center"},
    "course_name": {"x": 50, "y": 58, "fontSize": 24, "color": "#1a1a1a", "fontFamily": "Helvetica", "align": "center"},
    "completion_date": {"x": 30, "y": 80, "fontSize": 16, "color": "#444444", "fontFamily": "Helvetica", "align": "center"},
    "certificate_id": {"x": 70, "y": 80, "fontSize": 14, "color": "#666666", "fontFamily": "Courier", "align": "center"},
    "organization_name": {"x": 50, "y": 90, "fontSize": 18, "color": "#1a1a1a", "fontFamily": "Helvetica", "align": "center"}
  }'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id)
);

-- Partial unique index for global default (only one row with course_id = null)
CREATE UNIQUE INDEX certificate_templates_global_unique 
  ON public.certificate_templates ((1)) 
  WHERE course_id IS NULL;

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view certificate templates"
  ON public.certificate_templates FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage certificate templates"
  ON public.certificate_templates FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE TRIGGER update_certificate_templates_updated_at
  BEFORE UPDATE ON public.certificate_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('certificate-templates', 'certificate-templates', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', true);

-- Storage policies for certificate-templates bucket
CREATE POLICY "Anyone can view certificate template images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificate-templates');

CREATE POLICY "Admins can upload certificate template images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'certificate-templates' AND is_admin());

CREATE POLICY "Admins can update certificate template images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'certificate-templates' AND is_admin());

CREATE POLICY "Admins can delete certificate template images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'certificate-templates' AND is_admin());

-- Storage policies for certificates bucket (generated PDFs)
CREATE POLICY "Anyone can view generated certificates"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificates');

CREATE POLICY "Admins can manage generated certificates"
  ON storage.objects FOR ALL
  USING (bucket_id = 'certificates' AND is_admin())
  WITH CHECK (bucket_id = 'certificates' AND is_admin());