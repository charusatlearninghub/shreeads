import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { renderCertificatePdf, corsHeaders } from '../_shared/certificate-renderer.ts';

interface CertificateRequest {
  course_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'No authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser } } = await adminClient.auth.getUser(token);
    if (!authUser) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const user = { id: authUser.id };
    const { course_id }: CertificateRequest = await req.json();
    if (!course_id) return new Response(JSON.stringify({ error: 'course_id is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: enrollment } = await adminClient.from('enrollments').select('id').eq('user_id', user.id).eq('course_id', course_id).single();
    if (!enrollment) return new Response(JSON.stringify({ error: 'You are not enrolled in this course' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: existingCert } = await adminClient.from('certificates').select('id, certificate_number, pdf_url').eq('user_id', user.id).eq('course_id', course_id).single();
    if (existingCert) return new Response(JSON.stringify({ message: 'Certificate already exists', certificate: existingCert }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: lessons } = await adminClient.from('lessons').select('id').eq('course_id', course_id);
    if (!lessons || lessons.length === 0) return new Response(JSON.stringify({ error: 'No lessons found in this course' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: progress } = await adminClient.from('lesson_progress').select('lesson_id').eq('user_id', user.id).in('lesson_id', lessons.map(l => l.id)).eq('is_completed', true);
    const completed = new Set(progress?.map(p => p.lesson_id) || []);
    if (!lessons.every(l => completed.has(l.id))) {
      return new Response(JSON.stringify({ error: `Progress: ${completed.size}/${lessons.length}`, completed: completed.size, total: lessons.length }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const year = new Date().getFullYear();
    const randomPart = crypto.randomUUID().split('-')[0].toUpperCase();
    const certificateNumber = `CERT-${year}-${randomPart}`;

    const [courseRes, profileRes] = await Promise.all([
      adminClient.from('courses').select('title').eq('id', course_id).single(),
      adminClient.from('profiles').select('full_name, email').eq('id', user.id).single(),
    ]);
    const courseName = courseRes.data?.title || 'Course';
    const userName = profileRes.data?.full_name || profileRes.data?.email || 'Student';

    // Per-course → global fallback
    const { data: courseTemplate } = await adminClient
      .from('certificate_templates').select('*').eq('course_id', course_id).eq('is_active', true).maybeSingle();
    const { data: globalTemplate } = !courseTemplate
      ? await adminClient.from('certificate_templates').select('*').is('course_id', null).eq('is_active', true).maybeSingle()
      : { data: null };
    const template = courseTemplate || globalTemplate;

    let pdfUrl: string | null = null;
    if (template) {
      try {
        const { data: customFonts } = await adminClient.from('certificate_fonts').select('name, font_url');
        const pdfBytes = await renderCertificatePdf(
          template,
          { student_name: userName, course_name: courseName, completion_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), certificate_id: certificateNumber, organization_name: template.organization_name },
          customFonts || [],
        );
        const filePath = `${certificateNumber}.pdf`;
        const { error: uploadErr } = await adminClient.storage.from('certificates').upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: true });
        if (uploadErr) console.error('Upload error:', uploadErr);
        else {
          const { data: pub } = adminClient.storage.from('certificates').getPublicUrl(filePath);
          pdfUrl = pub.publicUrl;
        }
      } catch (e) {
        console.error('PDF generation failed:', e);
      }
    }

    const { data: certificate, error: insertError } = await adminClient
      .from('certificates')
      .insert({ user_id: user.id, course_id, certificate_number: certificateNumber, pdf_url: pdfUrl })
      .select().single();

    if (insertError) return new Response(JSON.stringify({ error: 'Failed to generate certificate' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    return new Response(JSON.stringify({
      success: true,
      certificate: { id: certificate.id, certificate_number: certificateNumber, course_name: courseName, user_name: userName, issued_at: certificate.issued_at, pdf_url: pdfUrl },
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
