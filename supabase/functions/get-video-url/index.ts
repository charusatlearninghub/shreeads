import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS: allow frontend to call this from the browser; auth is required for video access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { lessonId } = await req.json();

    if (!lessonId) {
      return new Response(
        JSON.stringify({ error: 'Lesson ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get lesson and verify access
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, video_url, course_id, is_preview')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return new Response(
        JSON.stringify({ error: 'Lesson not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check access: admin, preview, free course, or enrolled
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (!isAdmin && !lesson.is_preview) {
      const { data: course } = await supabase
        .from('courses')
        .select('is_free, price')
        .eq('id', lesson.course_id)
        .single();

      const courseIsFree = course?.is_free === true || (course?.price != null && Number(course.price) === 0);

      if (!courseIsFree) {
        const { data: isEnrolled } = await supabase.rpc('is_enrolled', {
          _user_id: user.id,
          _course_id: lesson.course_id,
        });

        if (!isEnrolled) {
          return new Response(
            JSON.stringify({ error: 'Not enrolled in this course' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    if (!lesson.video_url) {
      return new Response(
        JSON.stringify({ error: 'No video for this lesson' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const videoUrl = lesson.video_url;

    // If it's a YouTube URL, return it directly (YouTube handles its own protection)
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      return new Response(
        JSON.stringify({ url: videoUrl, type: 'youtube' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If it's a Supabase storage path (no http), return public URL for course-videos bucket.
    // Public URLs work reliably with <video>; bucket is public so no signed URL needed.
    if (!videoUrl.startsWith('http')) {
      const path = videoUrl.replace(/^\/+|\/+$/g, ''); // normalize: trim leading/trailing slashes
      const { data: publicUrlData } = supabase.storage
        .from('course-videos')
        .getPublicUrl(path);

      const url = publicUrlData?.publicUrl;
      if (!url) {
        return new Response(
          JSON.stringify({ error: 'Failed to get video URL' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ url, type: 'direct' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // External URL - return with a session token for tracking
    return new Response(
      JSON.stringify({ url: videoUrl, type: 'direct' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
