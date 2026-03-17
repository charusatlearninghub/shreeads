import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface VerifyRequest {
  certificate_number: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { certificate_number }: VerifyRequest = await req.json();

    if (!certificate_number) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Certificate number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the certificate
    const { data: certificate, error } = await adminClient
      .from('certificates')
      .select(`
        id,
        certificate_number,
        issued_at,
        user_id,
        course_id
      `)
      .eq('certificate_number', certificate_number.toUpperCase().trim())
      .single();

    if (error || !certificate) {
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get course and user details
    const [courseResult, profileResult] = await Promise.all([
      adminClient.from('courses').select('title').eq('id', certificate.course_id).single(),
      adminClient.from('profiles').select('full_name, email').eq('id', certificate.user_id).single(),
    ]);

    const courseName = courseResult.data?.title || 'Unknown Course';
    const recipientName = profileResult.data?.full_name || 'Student';

    return new Response(
      JSON.stringify({
        valid: true,
        certificate: {
          certificate_number: certificate.certificate_number,
          issued_at: certificate.issued_at,
          course_title: courseName,
          recipient_name: recipientName,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Verification failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
