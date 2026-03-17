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

    // Use anon client with user's auth header for getClaims
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

    // Use service role client for database operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { fingerprint, deviceName } = await req.json();

    if (!fingerprint) {
      return new Response(
        JSON.stringify({ error: 'Device fingerprint is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing device registration for this user
    const { data: existingDevice, error: deviceError } = await adminClient
      .from('device_registrations')
      .select('*')
      .eq('user_id', userId)
      .eq('device_fingerprint', fingerprint)
      .maybeSingle();

    if (deviceError) {
      throw deviceError;
    }

    // If device is already registered for this user
    if (existingDevice) {
      // Update last used timestamp
      await adminClient
        .from('device_registrations')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', existingDevice.id);

      return new Response(
        JSON.stringify({ 
          registered: true, 
          blocked: !existingDevice.is_active,
          device: existingDevice,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has any other registered devices
    const { data: otherDevices, error: otherError } = await adminClient
      .from('device_registrations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (otherError) {
      throw otherError;
    }

    // If user has another device registered, block this one
    if (otherDevices && otherDevices.length > 0) {
      return new Response(
        JSON.stringify({ 
          registered: false, 
          blocked: true,
          error: 'Another device is already registered. Please use your registered device or contact support.',
          existingDevice: {
            deviceName: otherDevices[0].device_name,
            registeredAt: otherDevices[0].registered_at,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No device registered yet
    return new Response(
      JSON.stringify({ 
        registered: false, 
        blocked: false,
        needsRegistration: true,
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
