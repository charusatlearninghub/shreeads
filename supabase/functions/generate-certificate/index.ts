import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CertificateRequest {
  course_id: string;
}

interface FieldPos {
  x: number; // percentage 0-100
  y: number; // percentage 0-100 (from TOP)
  fontSize: number;
  color: string; // hex
  fontFamily: string; // 'Helvetica' | 'TimesRoman' | 'Courier'
  align?: 'left' | 'center' | 'right';
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b };
}

function getFont(name: string) {
  switch (name) {
    case 'TimesRoman': return StandardFonts.TimesRoman;
    case 'TimesRomanBold': return StandardFonts.TimesRomanBold;
    case 'Courier': return StandardFonts.Courier;
    case 'CourierBold': return StandardFonts.CourierBold;
    case 'HelveticaBold': return StandardFonts.HelveticaBold;
    default: return StandardFonts.Helvetica;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !authUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const user = { id: authUser.id };
    const { course_id }: CertificateRequest = await req.json();

    if (!course_id) {
      return new Response(JSON.stringify({ error: 'course_id is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check enrollment
    const { data: enrollment, error: enrollmentError } = await adminClient
      .from('enrollments').select('id').eq('user_id', user.id).eq('course_id', course_id).single();
    if (enrollmentError || !enrollment) {
      return new Response(JSON.stringify({ error: 'You are not enrolled in this course' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Existing certificate check
    const { data: existingCert } = await adminClient
      .from('certificates').select('id, certificate_number, pdf_url').eq('user_id', user.id).eq('course_id', course_id).single();
    if (existingCert) {
      return new Response(JSON.stringify({ message: 'Certificate already exists', certificate: existingCert }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Lessons + completion check
    const { data: lessons, error: lessonsError } = await adminClient.from('lessons').select('id').eq('course_id', course_id);
    if (lessonsError || !lessons || lessons.length === 0) {
      return new Response(JSON.stringify({ error: 'No lessons found in this course' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: progress } = await adminClient.from('lesson_progress')
      .select('lesson_id').eq('user_id', user.id).in('lesson_id', lessons.map(l => l.id)).eq('is_completed', true);
    const completedLessonIds = new Set(progress?.map(p => p.lesson_id) || []);
    const allCompleted = lessons.every(l => completedLessonIds.has(l.id));
    if (!allCompleted) {
      return new Response(JSON.stringify({ error: `Progress: ${completedLessonIds.size}/${lessons.length}`, completed: completedLessonIds.size, total: lessons.length }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Generate certificate number
    const year = new Date().getFullYear();
    const randomPart = crypto.randomUUID().split('-')[0].toUpperCase();
    const certificateNumber = `CERT-${year}-${randomPart}`;

    // Get course + profile
    const [courseResult, profileResult] = await Promise.all([
      adminClient.from('courses').select('title').eq('id', course_id).single(),
      adminClient.from('profiles').select('full_name, email').eq('id', user.id).single(),
    ]);
    const courseName = courseResult.data?.title || 'Course';
    const userName = profileResult.data?.full_name || profileResult.data?.email || 'Student';

    // Get template (per-course override → fallback to global default)
    const { data: courseTemplate } = await adminClient
      .from('certificate_templates').select('*').eq('course_id', course_id).eq('is_active', true).maybeSingle();
    const { data: globalTemplate } = !courseTemplate
      ? await adminClient.from('certificate_templates').select('*').is('course_id', null).eq('is_active', true).maybeSingle()
      : { data: null };
    const template = courseTemplate || globalTemplate;

    let pdfUrl: string | null = null;

    if (template) {
      try {
        // Fetch template image
        const imgRes = await fetch(template.template_url);
        if (!imgRes.ok) throw new Error(`Template fetch failed: ${imgRes.status}`);
        const imgBytes = new Uint8Array(await imgRes.arrayBuffer());
        const contentType = imgRes.headers.get('content-type') || '';

        const pdfDoc = await PDFDocument.create();
        const image = contentType.includes('png')
          ? await pdfDoc.embedPng(imgBytes)
          : await pdfDoc.embedJpg(imgBytes);

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

        const positions = template.field_positions as Record<string, FieldPos>;
        const completionDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const fields: Record<string, string> = {
          student_name: userName,
          course_name: courseName,
          completion_date: completionDate,
          certificate_id: certificateNumber,
          organization_name: template.organization_name,
        };

        for (const [key, value] of Object.entries(fields)) {
          const pos = positions[key];
          if (!pos) continue;
          const font = await pdfDoc.embedFont(getFont(pos.fontFamily));
          const { r, g, b } = hexToRgb(pos.color);
          const textWidth = font.widthOfTextAtSize(value, pos.fontSize);
          // x/y are percentages: x from left, y from top. PDF origin is bottom-left.
          let drawX = (pos.x / 100) * image.width;
          const drawY = image.height - (pos.y / 100) * image.height - pos.fontSize;
          if (pos.align === 'center' || !pos.align) drawX -= textWidth / 2;
          else if (pos.align === 'right') drawX -= textWidth;
          page.drawText(value, { x: drawX, y: drawY, size: pos.fontSize, font, color: rgb(r, g, b) });
        }

        const pdfBytes = await pdfDoc.save();
        const filePath = `${certificateNumber}.pdf`;
        const { error: uploadErr } = await adminClient.storage
          .from('certificates')
          .upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: true });

        if (uploadErr) {
          console.error('Upload error:', uploadErr);
        } else {
          const { data: pub } = adminClient.storage.from('certificates').getPublicUrl(filePath);
          pdfUrl = pub.publicUrl;
        }
      } catch (e) {
        console.error('PDF generation failed:', e);
      }
    }

    // Insert certificate row
    const { data: certificate, error: insertError } = await adminClient
      .from('certificates')
      .insert({ user_id: user.id, course_id, certificate_number: certificateNumber, pdf_url: pdfUrl })
      .select().single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to generate certificate' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: true,
      certificate: {
        id: certificate.id,
        certificate_number: certificateNumber,
        course_name: courseName,
        user_name: userName,
        issued_at: certificate.issued_at,
        pdf_url: pdfUrl,
      },
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
