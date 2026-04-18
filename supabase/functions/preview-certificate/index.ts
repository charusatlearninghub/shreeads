import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { renderCertificatePdf, corsHeaders, type FieldPos } from '../_shared/certificate-renderer.ts';

interface PreviewRequest {
  template_url: string;
  organization_name: string;
  field_positions: Record<string, FieldPos>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await adminClient.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Admin-only
    const { data: roleRow } = await adminClient.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body: PreviewRequest = await req.json();
    if (!body.template_url || !body.field_positions) {
      return new Response(JSON.stringify({ error: 'template_url and field_positions are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: customFonts } = await adminClient.from('certificate_fonts').select('name, font_url');

    const pdfBytes = await renderCertificatePdf(
      {
        template_url: body.template_url,
        organization_name: body.organization_name || 'Organization',
        field_positions: body.field_positions,
      },
      {
        student_name: 'Ved Maniya',
        course_name: 'Digital Marketing & Meta Ads',
        completion_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        certificate_id: 'CERT-2026-PREVIEW',
        organization_name: body.organization_name || 'SHREE ADS LEARNx',
      },
      customFonts || [],
    );

    return new Response(pdfBytes, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="certificate-preview.pdf"' },
    });
  } catch (error) {
    console.error('Preview error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
