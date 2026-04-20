// Shared certificate PDF rendering helper.
// Imported by generate-certificate, preview-certificate, regenerate-certificate.
import { PDFDocument, StandardFonts, rgb, PDFFont } from 'https://esm.sh/pdf-lib@1.17.1';
import fontkit from 'https://esm.sh/@pdf-lib/fontkit@1.1.1';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Resolve a possibly-private Supabase Storage URL into a fetchable URL.
// Accepts: full public URL, full signed URL, or relative "<bucket>/<path>".
// If the URL points at a known private bucket, generate a 5-min signed URL.
const PRIVATE_BUCKETS = new Set(['certificate-templates', 'certificate-fonts', 'certificates', 'course-videos']);

async function resolveStorageUrl(url: string): Promise<string> {
  if (!url) return url;
  // External URL (not Supabase storage) — return as-is
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/storage\/v1\/object\/(?:public\/|sign\/|authenticated\/)?([^/]+)\/(.+)$/);
    if (!match) return url; // Not a storage URL
    const bucket = match[1];
    const path = decodeURIComponent(match[2].split('?')[0]);
    if (!PRIVATE_BUCKETS.has(bucket)) return url; // Public bucket, fine as-is
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) return url;
    const admin = createClient(supabaseUrl, serviceKey);
    const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, 300);
    if (error || !data?.signedUrl) {
      console.error(`Failed to sign ${bucket}/${path}:`, error);
      return url;
    }
    return data.signedUrl;
  } catch {
    return url;
  }
}

export interface FieldPos {
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  align?: 'left' | 'center' | 'right';
}

export interface CertificateTemplate {
  template_url: string;
  organization_name: string;
  field_positions: Record<string, FieldPos>;
}

export interface CertificateData {
  student_name: string;
  course_name: string;
  completion_date: string;
  certificate_id: string;
  organization_name: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b };
}

function getStandardFont(name: string) {
  switch (name) {
    case 'TimesRoman': return StandardFonts.TimesRoman;
    case 'TimesRomanBold': return StandardFonts.TimesRomanBold;
    case 'Courier': return StandardFonts.Courier;
    case 'CourierBold': return StandardFonts.CourierBold;
    case 'HelveticaBold': return StandardFonts.HelveticaBold;
    default: return StandardFonts.Helvetica;
  }
}

const BUILTIN_FONTS = new Set([
  'Helvetica', 'HelveticaBold', 'TimesRoman', 'TimesRomanBold', 'Courier', 'CourierBold',
]);

export async function renderCertificatePdf(
  template: CertificateTemplate,
  data: CertificateData,
  customFonts: Array<{ name: string; font_url: string }> = [],
): Promise<Uint8Array> {
  // Fetch background image (resolve private bucket → signed URL if needed)
  const fetchableTemplateUrl = await resolveStorageUrl(template.template_url);
  const imgRes = await fetch(fetchableTemplateUrl);
  if (!imgRes.ok) throw new Error(`Template image fetch failed: ${imgRes.status}`);
  const imgBytes = new Uint8Array(await imgRes.arrayBuffer());
  const contentType = imgRes.headers.get('content-type') || '';

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const image = contentType.includes('png') || template.template_url.toLowerCase().endsWith('.png')
    ? await pdfDoc.embedPng(imgBytes)
    : await pdfDoc.embedJpg(imgBytes);

  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

  // Embed fonts on demand and cache
  const fontCache = new Map<string, PDFFont>();
  const customFontMap = new Map(customFonts.map(f => [f.name, f.font_url]));

  async function getFont(family: string): Promise<PDFFont> {
    if (fontCache.has(family)) return fontCache.get(family)!;
    let font: PDFFont;
    if (BUILTIN_FONTS.has(family)) {
      font = await pdfDoc.embedFont(getStandardFont(family));
    } else if (customFontMap.has(family)) {
      const url = await resolveStorageUrl(customFontMap.get(family)!);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Font fetch failed for ${family}: ${res.status}`);
      const bytes = new Uint8Array(await res.arrayBuffer());
      font = await pdfDoc.embedFont(bytes);
    } else {
      // Unknown font — fall back to Helvetica
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
    fontCache.set(family, font);
    return font;
  }

  const fields: Record<string, string> = {
    student_name: data.student_name,
    course_name: data.course_name,
    completion_date: data.completion_date,
    certificate_id: data.certificate_id,
    organization_name: data.organization_name,
  };

  for (const [key, value] of Object.entries(fields)) {
    const pos = template.field_positions[key];
    if (!pos) continue;
    const font = await getFont(pos.fontFamily);
    const { r, g, b } = hexToRgb(pos.color);
    const textWidth = font.widthOfTextAtSize(value, pos.fontSize);
    let drawX = (pos.x / 100) * image.width;
    const drawY = image.height - (pos.y / 100) * image.height - pos.fontSize;
    if (pos.align === 'center' || !pos.align) drawX -= textWidth / 2;
    else if (pos.align === 'right') drawX -= textWidth;
    page.drawText(value, { x: drawX, y: drawY, size: pos.fontSize, font, color: rgb(r, g, b) });
  }

  return await pdfDoc.save();
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
