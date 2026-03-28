import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!roleData || roleData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { codeId, type } = await req.json();
    // type: 'course' or 'software'

    if (!codeId || !type) {
      return new Response(
        JSON.stringify({ error: 'codeId and type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'course') {
      // Fetch the promo code
      const { data: promoCode, error: fetchError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('id', codeId)
        .maybeSingle();

      if (fetchError || !promoCode) {
        return new Response(
          JSON.stringify({ error: 'Promo code not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Revoke access for every user recorded in usage (or legacy used_by)
      const { data: usageRows } = await supabase
        .from('promo_code_usage')
        .select('user_id')
        .eq('promo_code_id', codeId);

      let userIds = [...new Set((usageRows ?? []).map((r) => r.user_id))];
      if (userIds.length === 0 && promoCode.is_used && promoCode.used_by) {
        userIds = [promoCode.used_by];
      }

      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', promoCode.course_id);

      const lessonIds = lessons?.map((l) => l.id) ?? [];

      for (const uid of userIds) {
        if (lessonIds.length > 0) {
          await supabase
            .from('lesson_progress')
            .delete()
            .eq('user_id', uid)
            .in('lesson_id', lessonIds);
        }

        await supabase
          .from('certificates')
          .delete()
          .eq('user_id', uid)
          .eq('course_id', promoCode.course_id);

        await supabase
          .from('enrollments')
          .delete()
          .eq('user_id', uid)
          .eq('course_id', promoCode.course_id);
      }

      // Delete the promo code itself
      const { error: deleteError } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', codeId);

      if (deleteError) throw deleteError;

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: promoCode.is_used 
            ? 'Promo code deleted, enrollment revoked, and related data cleaned up' 
            : 'Promo code deleted' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (type === 'software') {
      // Fetch the software promo code
      const { data: promoCode, error: fetchError } = await supabase
        .from('software_promo_codes')
        .select('*')
        .eq('id', codeId)
        .maybeSingle();

      if (fetchError || !promoCode) {
        return new Response(
          JSON.stringify({ error: 'Promo code not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: usageRows } = await supabase
        .from('software_promo_code_usage')
        .select('user_id')
        .eq('software_promo_code_id', codeId);

      let userIds = [...new Set((usageRows ?? []).map((r) => r.user_id))];
      if (userIds.length === 0 && promoCode.is_used && promoCode.used_by) {
        userIds = [promoCode.used_by];
      }

      for (const uid of userIds) {
        const { data: purchases } = await supabase
          .from('software_purchases')
          .select('id')
          .eq('user_id', uid)
          .eq('product_id', promoCode.product_id)
          .eq('payment_method', 'promo_code');

        if (purchases && purchases.length > 0) {
          const purchaseIds = purchases.map((p) => p.id);
          await supabase.from('software_downloads').delete().in('purchase_id', purchaseIds);
          await supabase.from('software_purchases').delete().in('id', purchaseIds);
        }
      }

      // Delete the promo code itself
      const { error: deleteError } = await supabase
        .from('software_promo_codes')
        .delete()
        .eq('id', codeId);

      if (deleteError) throw deleteError;

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: promoCode.is_used 
            ? 'Promo code deleted and software access revoked' 
            : 'Promo code deleted' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid type. Use "course" or "software"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
