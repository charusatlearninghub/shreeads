import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface RedeemRequest {
  code: string;
  referral_code?: string | null;
}

function parseMoney(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') {
    return Number.isFinite(v) && v >= 0 ? v : 0;
  }
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** PostgREST often returns embedded FK rows as an object or a one-element array. */
function singleEmbed<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !authUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = { id: authUser.id };

    const { code, referral_code }: RedeemRequest = await req.json();

    if (!code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Promo code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize the code
    const normalizedCode = code.trim().toUpperCase();

    // Find the promo code
    const { data: promoCode, error: promoError } = await supabaseClient
      .from('promo_codes')
      .select('*, courses(*)')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (promoError) {
      console.error('Error fetching promo code:', promoError);
      return new Response(
        JSON.stringify({ error: 'Error validating promo code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!promoCode) {
      return new Response(
        JSON.stringify({ error: 'Invalid promo code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if code is already used
    if (promoCode.is_used) {
      return new Response(
        JSON.stringify({ error: 'This promo code has already been used' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if code is expired
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'This promo code has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is already enrolled in this course
    const { data: existingEnrollment } = await supabaseClient
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', promoCode.course_id)
      .maybeSingle();

    if (existingEnrollment) {
      return new Response(
        JSON.stringify({ error: 'You are already enrolled in this course' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const courseData = singleEmbed(
      promoCode.courses as
        | {
            title?: string;
            price?: number | null;
            discount_price?: number | null;
            is_free?: boolean | null;
          }
        | null
        | undefined,
    );
    const courseTitle = courseData?.title ?? 'Course';
    // Catalog list price at redeem time (snapshot). Do not zero this just because is_free is true,
    // so promo enrollments on mis-tagged courses still record original_price + paid promo amount.
    const listPrice =
      Number(courseData?.discount_price ?? courseData?.price ?? 0) || 0;
    const originalPrice = listPrice;

    // Authoritative promo price from DB row (avoids stale joined payloads)
    const { data: promoPricing, error: pricingErr } = await supabaseClient
      .from('promo_codes')
      .select('code, promo_price')
      .eq('id', promoCode.id)
      .single();

    if (pricingErr || !promoPricing) {
      console.error('promo_codes pricing fetch failed:', pricingErr);
      return new Response(
        JSON.stringify({ error: 'Failed to load promo code pricing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const promoRow = promoCode as { promo_price?: unknown; code: string };
    const codeStr = String(promoPricing.code ?? promoRow.code).trim();
    const promoPricePaid = parseMoney(promoPricing.promo_price ?? promoRow.promo_price);
    const finalPricePaid = promoPricePaid;

    // Paid catalog course requires a positive promo redemption price (avoid "free" enrollments by mistake)
    if (listPrice > 0 && promoPricePaid <= 0) {
      console.warn('[redeem-promo-code] blocked: paid course but promo_price is 0', {
        promo_code_id: promoCode.id,
        listPrice,
      });
      return new Response(
        JSON.stringify({
          error:
            'This promo code is not configured with a purchase price. Ask an admin to set the promo price on this code.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[redeem-promo-code] pricing', {
      promo_code_id: promoCode.id,
      code: codeStr,
      raw_promo_price: promoPricing.promo_price,
      promoPricePaid,
      listPrice,
      originalPrice,
      finalPricePaid,
    });

    const { error: updateError } = await supabaseClient
      .from('promo_codes')
      .update({
        is_used: true,
        used_by: user.id,
        used_at: new Date().toISOString(),
      })
      .eq('id', promoCode.id)
      .eq('is_used', false);

    if (updateError) {
      console.error('Error updating promo code:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to redeem promo code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the enrollment (DB trigger fills pricing if any column is missing / zero)
    const { data: enrollment, error: enrollmentError } = await supabaseClient
      .from('enrollments')
      .insert({
        user_id: user.id,
        course_id: promoCode.course_id,
        promo_code_id: promoCode.id,
        course_name: courseTitle,
        original_price: originalPrice,
        promo_code: codeStr,
        promo_price: promoPricePaid,
        final_price_paid: finalPricePaid,
        payment_type: 'promo_code',
      })
      .select('*, courses(*)')
      .single();

    if (enrollmentError) {
      console.error('Error creating enrollment:', enrollmentError);
      // Rollback the promo code update
      await supabaseClient
        .from('promo_codes')
        .update({
          is_used: false,
          used_by: null,
          used_at: null,
        })
        .eq('id', promoCode.id);

      return new Response(
        JSON.stringify({ error: 'Failed to create enrollment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    // Prefer Auth admin user payload (email + metadata) when profile is sparse
    let authEmail = authUser.email ?? '';
    let meta: Record<string, unknown> = (authUser.user_metadata ?? {}) as Record<string, unknown>;
    try {
      const { data: adminData, error: adminErr } = await supabaseClient.auth.admin.getUserById(
        user.id,
      );
      if (!adminErr && adminData?.user) {
        authEmail = adminData.user.email ?? authEmail;
        meta = { ...meta, ...(adminData.user.user_metadata ?? {}) };
      }
    } catch {
      // ignore — fall back to token user only
    }

    const metaFull =
      (typeof meta.full_name === 'string' && meta.full_name) ||
      (typeof meta.name === 'string' && meta.name) ||
      (typeof meta.display_name === 'string' && meta.display_name) ||
      '';

    const userEmail = (profile?.email || authEmail || '').trim();
    const userName = (
      profile?.full_name?.trim() ||
      metaFull ||
      userEmail.split('@')[0] ||
      'User'
    ).trim();

    const { error: usageError } = await supabaseClient.from('promo_code_usage').insert({
      promo_code_id: promoCode.id,
      promo_code: codeStr,
      user_id: user.id,
      user_name: userName || 'User',
      user_email: userEmail,
      course_id: promoCode.course_id,
      course_name: courseTitle,
      original_price_at_purchase: originalPrice,
      promo_price: promoPricePaid,
      final_price_paid: finalPricePaid,
      paid_amount: finalPricePaid,
    });

    if (usageError) {
      console.error('Error recording promo code usage:', usageError);
      await supabaseClient.from('enrollments').delete().eq('id', enrollment.id);
      await supabaseClient
        .from('promo_codes')
        .update({
          is_used: false,
          used_by: null,
          used_at: null,
        })
        .eq('id', promoCode.id);

      return new Response(
        JSON.stringify({ error: 'Failed to record promo code usage' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure paid amounts persisted (covers trigger/cache edge cases)
    const { error: enrollPatchErr } = await supabaseClient
      .from('enrollments')
      .update({
        course_name: courseTitle,
        original_price: originalPrice,
        promo_code: codeStr,
        promo_price: promoPricePaid,
        final_price_paid: finalPricePaid,
        payment_type: 'promo_code',
      })
      .eq('id', enrollment.id);
    if (enrollPatchErr) {
      console.error('enrollment pricing patch:', enrollPatchErr);
    }

    const { error: usagePatchErr } = await supabaseClient
      .from('promo_code_usage')
      .update({
        original_price_at_purchase: originalPrice,
        promo_price: promoPricePaid,
        final_price_paid: finalPricePaid,
        paid_amount: finalPricePaid,
      })
      .eq('promo_code_id', promoCode.id)
      .eq('user_id', user.id);
    if (usagePatchErr) {
      console.error('promo_code_usage pricing patch:', usagePatchErr);
    }

    const { data: verifyEnroll, error: verifyErr } = await supabaseClient
      .from('enrollments')
      .select('final_price_paid, promo_price')
      .eq('id', enrollment.id)
      .single();

    if (verifyErr) {
      console.error('[redeem-promo-code] enrollment verify read:', verifyErr);
    } else {
      const stored = parseMoney(verifyEnroll?.final_price_paid ?? verifyEnroll?.promo_price);
      if (Math.abs(stored - finalPricePaid) > 0.005) {
        console.warn('[redeem-promo-code] enrollment amount mismatch, patching', {
          enrollment_id: enrollment.id,
          expected: finalPricePaid,
          stored,
        });
        await supabaseClient
          .from('enrollments')
          .update({
            promo_price: promoPricePaid,
            final_price_paid: finalPricePaid,
            payment_type: 'promo_code',
          })
          .eq('id', enrollment.id);
      }
      const { data: verifyUsage } = await supabaseClient
        .from('promo_code_usage')
        .select('id, paid_amount, final_price_paid')
        .eq('promo_code_id', promoCode.id)
        .eq('user_id', user.id)
        .maybeSingle();
      const usagePaid = parseMoney(verifyUsage?.paid_amount ?? verifyUsage?.final_price_paid);
      if (verifyUsage && Math.abs(usagePaid - finalPricePaid) > 0.005) {
        console.warn('[redeem-promo-code] usage amount mismatch, patching', {
          usage_id: verifyUsage.id,
          expected: finalPricePaid,
          usagePaid,
        });
        await supabaseClient
          .from('promo_code_usage')
          .update({
            promo_price: promoPricePaid,
            final_price_paid: finalPricePaid,
            paid_amount: finalPricePaid,
          })
          .eq('id', verifyUsage.id);
      }
      const { data: afterEnroll } = await supabaseClient
        .from('enrollments')
        .select('final_price_paid, promo_price')
        .eq('id', enrollment.id)
        .single();
      console.log('[redeem-promo-code] persisted enrollment amounts', {
        enrollment_id: enrollment.id,
        final_price_paid: afterEnroll?.final_price_paid,
        promo_price: afterEnroll?.promo_price,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully enrolled in course',
        enrollment: {
          id: enrollment.id,
          course: singleEmbed(
            promoCode.courses as Record<string, unknown> | Record<string, unknown>[] | null | undefined,
          ),
          final_price_paid: finalPricePaid,
          promo_price: promoPricePaid,
          original_price: originalPrice,
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
