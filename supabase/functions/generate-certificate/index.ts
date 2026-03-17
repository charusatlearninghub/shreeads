import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CertificateRequest {
  course_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !authUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = { id: authUser.id };

    const { course_id }: CertificateRequest = await req.json();

    if (!course_id) {
      return new Response(
        JSON.stringify({ error: 'course_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is enrolled in the course
    const { data: enrollment, error: enrollmentError } = await adminClient
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', course_id)
      .single();

    if (enrollmentError || !enrollment) {
      return new Response(
        JSON.stringify({ error: 'You are not enrolled in this course' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if certificate already exists
    const { data: existingCert } = await adminClient
      .from('certificates')
      .select('id, certificate_number')
      .eq('user_id', user.id)
      .eq('course_id', course_id)
      .single();

    if (existingCert) {
      return new Response(
        JSON.stringify({ 
          message: 'Certificate already exists',
          certificate: existingCert 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all lessons for the course
    const { data: lessons, error: lessonsError } = await adminClient
      .from('lessons')
      .select('id')
      .eq('course_id', course_id);

    if (lessonsError || !lessons || lessons.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No lessons found in this course' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user completed all lessons
    const { data: progress, error: progressError } = await adminClient
      .from('lesson_progress')
      .select('lesson_id, is_completed')
      .eq('user_id', user.id)
      .in('lesson_id', lessons.map(l => l.id))
      .eq('is_completed', true);

    if (progressError) {
      return new Response(
        JSON.stringify({ error: 'Failed to check progress' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const completedLessonIds = new Set(progress?.map(p => p.lesson_id) || []);
    const allCompleted = lessons.every(l => completedLessonIds.has(l.id));

    if (!allCompleted) {
      const completedCount = completedLessonIds.size;
      const totalCount = lessons.length;
      return new Response(
        JSON.stringify({ 
          error: `You have not completed all lessons. Progress: ${completedCount}/${totalCount}`,
          completed: completedCount,
          total: totalCount
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate certificate number
    const year = new Date().getFullYear();
    const randomPart = crypto.randomUUID().split('-')[0].toUpperCase();
    const certificateNumber = `CERT-${year}-${randomPart}`;

    // Get course and user details for the certificate
    const [courseResult, profileResult] = await Promise.all([
      adminClient.from('courses').select('title').eq('id', course_id).single(),
      adminClient.from('profiles').select('full_name, email').eq('id', user.id).single(),
    ]);

    const courseName = courseResult.data?.title || 'Course';
    const userName = profileResult.data?.full_name || profileResult.data?.email || 'Student';

    // Insert certificate record
    const { data: certificate, error: insertError } = await adminClient
      .from('certificates')
      .insert({
        user_id: user.id,
        course_id: course_id,
        certificate_number: certificateNumber,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate certificate' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        certificate: {
          id: certificate.id,
          certificate_number: certificateNumber,
          course_name: courseName,
          user_name: userName,
          issued_at: certificate.issued_at,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
