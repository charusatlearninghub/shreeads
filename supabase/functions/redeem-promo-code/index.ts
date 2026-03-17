import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface RedeemRequest {
  code: string;
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

    const { code }: RedeemRequest = await req.json();

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

    // Start transaction: mark code as used and create enrollment
    // Mark the promo code as used
    const { error: updateError } = await supabaseClient
      .from('promo_codes')
      .update({
        is_used: true,
        used_by: user.id,
        used_at: new Date().toISOString(),
      })
      .eq('id', promoCode.id)
      .eq('is_used', false); // Ensure it wasn't used in a race condition

    if (updateError) {
      console.error('Error updating promo code:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to redeem promo code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the enrollment
    const { data: enrollment, error: enrollmentError } = await supabaseClient
      .from('enrollments')
      .insert({
        user_id: user.id,
        course_id: promoCode.course_id,
        promo_code_id: promoCode.id,
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

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully enrolled in course',
        enrollment: {
          id: enrollment.id,
          course: promoCode.courses,
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
