// Admin debug tool: issue a certificate for any course/user combo,
// bypassing enrollment + lesson-completion checks. Admin-only.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { renderCertificatePdf, corsHeaders } from '../_shared/certificate-renderer.ts';

interface DebugRequest {
  course_id: string;
  user_id?: string; // defaults to caller
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'No authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await adminClient.auth.getUser(token);
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: roleRow } = await adminClient.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body: DebugRequest = await req.json();
    if (!body.course_id) return new Response(JSON.stringify({ error: 'course_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const targetUserId = body.user_id || user.id;

    // Allow re-issuing: delete existing certificate for this combo first
    await adminClient.from('certificates').delete().eq('user_id', targetUserId).eq('course_id', body.course_id);

    const year = new Date().getFullYear();
    const randomPart = crypto.randomUUID().split('-')[0].toUpperCase();
    const certificateNumber = `CERT-${year}-TEST-${randomPart}`;

    const [courseRes, profileRes] = await Promise.all([
      adminClient.from('courses').select('title').eq('id', body.course_id).single(),
      adminClient.from('profiles').select('full_name, email').eq('id', targetUserId).single(),
    ]);
    const courseName = courseRes.data?.title || 'Course';
    const userName = profileRes.data?.full_name || profileRes.data?.email || 'Student';

    // Load template (per-course → global fallback)
    const { data: courseTemplate } = await adminClient
      .from('certificate_templates').select('*').eq('course_id', body.course_id).eq('is_active', true).maybeSingle();
    const { data: globalTemplate } = !courseTemplate
      ? await adminClient.from('certificate_templates').select('*').is('course_id', null).eq('is_active', true).maybeSingle()
      : { data: null };
    const template = courseTemplate || globalTemplate;

    let pdfUrl: string | null = null;
    if (template) {
      const { data: customFonts } = await adminClient.from('certificate_fonts').select('name, font_url');
      const pdfBytes = await renderCertificatePdf(
        template,
        { student_name: userName, course_name: courseName, completion_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), certificate_id: certificateNumber, organization_name: template.organization_name },
        customFonts || [],
      );
      const filePath = `${certificateNumber}.pdf`;
      await adminClient.storage.from('certificates').upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: true });
      const { data: pub } = adminClient.storage.from('certificates').getPublicUrl(filePath);
      pdfUrl = pub.publicUrl;
    }

    const { data: certificate, error: insertError } = await adminClient
      .from('certificates')
      .insert({ user_id: targetUserId, course_id: body.course_id, certificate_number: certificateNumber, pdf_url: pdfUrl })
      .select().single();

    if (insertError) return new Response(JSON.stringify({ error: insertError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    return new Response(JSON.stringify({ success: true, certificate, pdf_url: pdfUrl, has_template: !!template }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Debug cert error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
