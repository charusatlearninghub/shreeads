import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { renderCertificatePdf, corsHeaders } from '../_shared/certificate-renderer.ts';

interface RegenerateRequest {
  certificate_id?: string;   // single
  course_id?: string;        // bulk: all certificates for this course
}

async function loadTemplate(adminClient: SupabaseClient, courseId: string) {
  const { data: courseTemplate } = await adminClient
    .from('certificate_templates').select('*').eq('course_id', courseId).eq('is_active', true).maybeSingle();
  if (courseTemplate) return courseTemplate;
  const { data: globalTemplate } = await adminClient
    .from('certificate_templates').select('*').is('course_id', null).eq('is_active', true).maybeSingle();
  return globalTemplate;
}

async function regenerateOne(
  adminClient: SupabaseClient,
  cert: { id: string; certificate_number: string; course_id: string; user_id: string; issued_at: string },
  customFonts: Array<{ name: string; font_url: string }>,
): Promise<{ ok: boolean; error?: string; pdf_url?: string }> {
  const template = await loadTemplate(adminClient, cert.course_id);
  if (!template) return { ok: false, error: 'No template configured' };

  const [courseRes, profileRes] = await Promise.all([
    adminClient.from('courses').select('title').eq('id', cert.course_id).single(),
    adminClient.from('profiles').select('full_name, email').eq('id', cert.user_id).single(),
  ]);
  const courseName = courseRes.data?.title || 'Course';
  const userName = profileRes.data?.full_name || profileRes.data?.email || 'Student';
  const issuedDate = new Date(cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const pdfBytes = await renderCertificatePdf(
    template,
    { student_name: userName, course_name: courseName, completion_date: issuedDate, certificate_id: cert.certificate_number, organization_name: template.organization_name },
    customFonts,
  );

  const filePath = `${cert.certificate_number}.pdf`;
  const { error: upErr } = await adminClient.storage.from('certificates').upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: true });
  if (upErr) return { ok: false, error: upErr.message };
  const { data: pub } = adminClient.storage.from('certificates').getPublicUrl(filePath);
  await adminClient.from('certificates').update({ pdf_url: pub.publicUrl }).eq('id', cert.id);
  return { ok: true, pdf_url: pub.publicUrl };
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

    const body: RegenerateRequest = await req.json();
    if (!body.certificate_id && !body.course_id) {
      return new Response(JSON.stringify({ error: 'certificate_id or course_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: customFonts } = await adminClient.from('certificate_fonts').select('name, font_url');

    let certs: any[] = [];
    if (body.certificate_id) {
      const { data } = await adminClient.from('certificates').select('id, certificate_number, course_id, user_id, issued_at').eq('id', body.certificate_id);
      certs = data || [];
    } else {
      const { data } = await adminClient.from('certificates').select('id, certificate_number, course_id, user_id, issued_at').eq('course_id', body.course_id!);
      certs = data || [];
    }

    if (certs.length === 0) return new Response(JSON.stringify({ error: 'No certificates found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const results = [];
    for (const c of certs) {
      try {
        const r = await regenerateOne(adminClient, c, customFonts || []);
        results.push({ id: c.id, certificate_number: c.certificate_number, ...r });
      } catch (e) {
        results.push({ id: c.id, certificate_number: c.certificate_number, ok: false, error: (e as Error).message });
      }
    }

    const successCount = results.filter(r => r.ok).length;
    return new Response(JSON.stringify({ success: true, total: results.length, succeeded: successCount, results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Regenerate error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
