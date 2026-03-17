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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { fingerprint, deviceName } = await req.json();

    if (!fingerprint) {
      return new Response(
        JSON.stringify({ error: 'Device fingerprint is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already has a registered device
    const { data: existingDevices, error: existingError } = await adminClient
      .from('device_registrations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (existingError) {
      throw existingError;
    }

    // If user already has a device registered, deny registration
    if (existingDevices && existingDevices.length > 0) {
      // Check if it's the same device
      const sameDevice = existingDevices.find(d => d.device_fingerprint === fingerprint);
      if (sameDevice) {
        // Just update last used
        await adminClient
          .from('device_registrations')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', sameDevice.id);

        return new Response(
          JSON.stringify({ success: true, message: 'Device already registered' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          blocked: true,
          error: 'You already have a registered device. Only one device is allowed per account.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Register the new device
    const { data: newDevice, error: insertError } = await adminClient
      .from('device_registrations')
      .insert({
        user_id: userId,
        device_fingerprint: fingerprint,
        device_name: deviceName || 'Unknown Device',
        is_active: true,
        registered_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      // Handle unique constraint violation (race condition)
      if (insertError.code === '23505') {
        return new Response(
          JSON.stringify({ success: true, message: 'Device already registered' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Device registered successfully',
        device: newDevice,
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
