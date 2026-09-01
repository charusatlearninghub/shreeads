import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BUCKET = 'software-files';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

/**
 * Normalises whatever is stored in software_versions.file_url into an object
 * storage path inside the `software-files` bucket.
 * Handles: plain paths, paths with a leading slash, legacy public URLs and
 * legacy signed URLs.
 */
function extractStoragePath(fileUrl: string): string | null {
  let value = (fileUrl || '').trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      // Only URLs that point at this bucket can be resolved to a path.
      const marker = `/${BUCKET}/`;
      const idx = url.pathname.indexOf(marker);
      if (idx === -1) return null;
      value = url.pathname.slice(idx + marker.length);
      value = decodeURIComponent(value);
    } catch {
      return null;
    }
  }

  return value.replace(/^\/+/, '');
}

const CONTENT_TYPES: Record<string, string> = {
  apk: 'application/vnd.android.package-archive',
  zip: 'application/zip',
  exe: 'application/vnd.microsoft.portable-executable',
  msi: 'application/x-msi',
  dmg: 'application/x-apple-diskimage',
  rar: 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  deb: 'application/vnd.debian.binary-package',
  pdf: 'application/pdf',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Auth is optional: free products can be downloaded by anyone.
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '');
      const { data } = await supabase.auth.getUser(token);
      userId = data?.user?.id ?? null;
    }

    const { versionId, productId } = await req.json().catch(() => ({}));
    if (!versionId || !productId) {
      return json({ error: 'Version ID and product ID are required' }, 400);
    }

    const { data: product } = await supabase
      .from('software_products')
      .select('is_free, price')
      .eq('id', productId)
      .maybeSingle();

    if (!product) return json({ error: 'Software not found' }, 404);

    const isFree = product.is_free === true || Number(product.price ?? 0) === 0;

    if (!isFree) {
      if (!userId) {
        return json({ error: 'Please sign in to download this software' }, 401);
      }
      const { data: purchase } = await supabase
        .from('software_purchases')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle();

      if (!purchase) {
        return json({ error: 'You have not purchased this software' }, 403);
      }
    }

    const { data: version } = await supabase
      .from('software_versions')
      .select('file_url, file_type, version_number, platform')
      .eq('id', versionId)
      .eq('product_id', productId)
      .maybeSingle();

    if (!version) return json({ error: 'Version not found' }, 404);

    // External / third-party hosted file — return the link as-is.
    const storedUrl: string = version.file_url ?? '';
    const path = extractStoragePath(storedUrl);

    if (!path) {
      if (/^https?:\/\//i.test(storedUrl)) {
        return json({ url: storedUrl, external: true });
      }
      return json({ error: 'This version has no downloadable file' }, 404);
    }

    // Preserve the original filename when available, otherwise build a sane one.
    const ext = (version.file_type || path.split('.').pop() || 'bin').toLowerCase();
    const base = decodeURIComponent(path.split('/').pop() || '');
    const filename = base.includes('.')
      ? base
      : `${version.platform ?? 'app'}-${version.version_number ?? '1.0'}.${ext}`;

    const { data: signed, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 3600, { download: filename });

    if (signErr || !signed?.signedUrl) {
      console.error('Failed to sign', path, signErr);
      return json(
        { error: 'The file for this version is missing. Please contact support.' },
        404,
      );
    }

    return json({
      url: signed.signedUrl,
      filename,
      contentType: CONTENT_TYPES[ext] ?? 'application/octet-stream',
      external: false,
    });
  } catch (error) {
    console.error('get-software-download error:', error);
    return json({ error: 'Failed to generate download link' }, 500);
  }
});
