import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS: allow frontend to call this from the browser; auth is required for video access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BUCKET = 'course-videos';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

/**
 * Extract a storage object path from any of the supported video_url shapes:
 *  - "folder/file.mp4"                                   -> "folder/file.mp4"
 *  - ".../object/public/course-videos/folder/file.mp4"   -> "folder/file.mp4"
 *  - ".../object/sign/course-videos/folder/file.mp4?..." -> "folder/file.mp4"
 *  - ".../object/course-videos/folder/file.mp4"          -> "folder/file.mp4"
 * Returns null if it doesn't look like a course-videos storage path.
 */
function extractStoragePath(videoUrl: string): string | null {
  if (!videoUrl) return null;

  // Already a relative storage path
  if (!videoUrl.startsWith('http')) {
    return videoUrl.replace(/^\/+|\/+$/g, '');
  }

  try {
    const u = new URL(videoUrl);
    // Match /storage/v1/object/(public|sign|authenticated)?/<bucket>/<path>
    const match = u.pathname.match(
      /\/storage\/v1\/object\/(?:public\/|sign\/|authenticated\/)?([^/]+)\/(.+)$/
    );
    if (match && match[1] === BUCKET) {
      return decodeURIComponent(match[2]);
    }
    return null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { lessonId } = await req.json();
    console.log('[get-video-url] lessonId:', lessonId, 'user:', user.id);

    if (!lessonId) {
      return new Response(JSON.stringify({ error: 'Lesson ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get lesson and verify access
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, video_url, course_id, is_preview')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      console.error('[get-video-url] lesson not found:', lessonError);
      return new Response(JSON.stringify({ error: 'Lesson not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check access: admin, preview, free course, or enrolled
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (!isAdmin && !lesson.is_preview) {
      const { data: course } = await supabase
        .from('courses')
        .select('is_free, price')
        .eq('id', lesson.course_id)
        .single();

      const courseIsFree =
        course?.is_free === true ||
        (course?.price != null && Number(course.price) === 0);

      if (!courseIsFree) {
        const { data: isEnrolled } = await supabase.rpc('is_enrolled', {
          _user_id: user.id,
          _course_id: lesson.course_id,
        });

        if (!isEnrolled) {
          return new Response(
            JSON.stringify({ error: 'Not enrolled in this course' }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
    }

    if (!lesson.video_url) {
      return new Response(
        JSON.stringify({ error: 'No video for this lesson' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const videoUrl = lesson.video_url;
    console.log('[get-video-url] raw video_url:', videoUrl);

    // YouTube — return as-is
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      return new Response(
        JSON.stringify({ url: videoUrl, type: 'youtube' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to resolve as a course-videos storage path (relative OR full Supabase URL)
    const storagePath = extractStoragePath(videoUrl);
    console.log('[get-video-url] resolved storage path:', storagePath, 'bucket:', BUCKET);

    if (storagePath) {
      // Verify file exists before signing — gives a clearer error
      const lastSlash = storagePath.lastIndexOf('/');
      const folder = lastSlash >= 0 ? storagePath.slice(0, lastSlash) : '';
      const filename = lastSlash >= 0 ? storagePath.slice(lastSlash + 1) : storagePath;

      const { data: listData, error: listError } = await supabase.storage
        .from(BUCKET)
        .list(folder, { search: filename, limit: 1 });

      if (listError) {
        console.error('[get-video-url] list error:', listError);
      }
      const fileExists = !!listData?.find((f) => f.name === filename);
      if (!fileExists) {
        console.error('[get-video-url] video file not found in storage:', storagePath);
        return new Response(
          JSON.stringify({ error: 'Video file not found in storage' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: signed, error: signError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

      if (signError || !signed?.signedUrl) {
        console.error('[get-video-url] sign error:', signError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate signed URL' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log('[get-video-url] signed URL generated, ttl(s):', SIGNED_URL_TTL_SECONDS);
      return new Response(
        JSON.stringify({
          url: signed.signedUrl,
          type: 'signed',
          expiresIn: SIGNED_URL_TTL_SECONDS,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // External URL (not Supabase storage) — pass through
    return new Response(
      JSON.stringify({ url: videoUrl, type: 'direct' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[get-video-url] unhandled error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
