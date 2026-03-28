import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !authUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = { id: authUser.id };

    const { code, productId } = await req.json();

    if (!code || !productId) {
      return new Response(
        JSON.stringify({ error: 'Code and product ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already purchased
    const { data: existingPurchase } = await supabase
      .from('software_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle();

    if (existingPurchase) {
      return new Response(
        JSON.stringify({ error: 'You already own this software' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the promo code
    const { data: promoCode, error: codeError } = await supabase
      .from('software_promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('product_id', productId)
      .maybeSingle();

    if (codeError || !promoCode) {
      return new Response(
        JSON.stringify({ error: 'Invalid promo code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (promoCode.is_used) {
      return new Response(
        JSON.stringify({ error: 'This code has already been used' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'This code has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: productRow } = await supabase
      .from('software_products')
      .select('title, price, discount_price, is_free')
      .eq('id', productId)
      .maybeSingle();

    const isFreeProduct = productRow?.is_free === true;
    const originalSoftwarePrice = isFreeProduct
      ? 0
      : Number(productRow?.discount_price ?? productRow?.price ?? 0) || 0;
    const rawSwPromo = (promoCode as { promo_price?: number | string | null }).promo_price;
    const softwarePromoPaid = Math.max(
      0,
      Number(rawSwPromo) === Number(rawSwPromo) ? Number(rawSwPromo) : 0,
    );

    // Mark code as used
    const { error: updateError } = await supabase
      .from('software_promo_codes')
      .update({
        is_used: true,
        used_by: user.id,
        used_at: new Date().toISOString(),
      })
      .eq('id', promoCode.id);

    if (updateError) {
      console.error('Failed to update promo code:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to redeem code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create purchase record
    const { error: purchaseError } = await supabase
      .from('software_purchases')
      .insert({
        user_id: user.id,
        product_id: productId,
        payment_method: 'promo_code',
        amount_paid: softwarePromoPaid,
      });

    if (purchaseError) {
      console.error('Failed to create purchase:', purchaseError);
      // Rollback the promo code update
      await supabase
        .from('software_promo_codes')
        .update({ is_used: false, used_by: null, used_at: null })
        .eq('id', promoCode.id);

      return new Response(
        JSON.stringify({ error: 'Failed to complete purchase' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    let authEmail = authUser.email ?? '';
    let meta: Record<string, unknown> = (authUser.user_metadata ?? {}) as Record<string, unknown>;
    try {
      const { data: adminData, error: adminErr } = await supabase.auth.admin.getUserById(user.id);
      if (!adminErr && adminData?.user) {
        authEmail = adminData.user.email ?? authEmail;
        meta = { ...meta, ...(adminData.user.user_metadata ?? {}) };
      }
    } catch {
      // ignore
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

    const { error: usageError } = await supabase.from('software_promo_code_usage').insert({
      software_promo_code_id: promoCode.id,
      promo_code: promoCode.code,
      user_id: user.id,
      user_name: userName || 'User',
      user_email: userEmail,
      product_id: productId,
      product_name: productRow?.title ?? 'Software',
      original_price_at_purchase: originalSoftwarePrice,
      promo_price: softwarePromoPaid,
      final_price_paid: softwarePromoPaid,
    });

    if (usageError) {
      console.error('Failed to record software promo usage:', usageError);
      await supabase
        .from('software_purchases')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('payment_method', 'promo_code');
      await supabase
        .from('software_promo_codes')
        .update({ is_used: false, used_by: null, used_at: null })
        .eq('id', promoCode.id);

      return new Response(
        JSON.stringify({ error: 'Failed to record promo code usage' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Software unlocked successfully!' }),
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
