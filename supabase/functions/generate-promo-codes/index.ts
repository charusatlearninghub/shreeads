import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Generate random alphanumeric code
function generateCode(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (roleError || !roleData || roleData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Admin access required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { courseId, quantity, expiresAt, prefix } = await req.json();

    if (!courseId) {
      return new Response(
        JSON.stringify({ error: 'Course ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const count = Math.min(Math.max(parseInt(quantity) || 1, 1), 100); // Max 100 at a time
    const codes: string[] = [];
    const createdCodes: any[] = [];
    
    // Generate unique codes
    for (let i = 0; i < count; i++) {
      let code: string;
      let attempts = 0;
      
      do {
        code = prefix ? `${prefix}-${generateCode(6)}` : generateCode(8);
        attempts++;
      } while (codes.includes(code) && attempts < 10);
      
      codes.push(code);
    }

    // Insert all codes
    const codesToInsert = codes.map(code => ({
      code,
      course_id: courseId,
      expires_at: expiresAt || null,
      is_used: false,
      created_by: userId,
    }));

    const { data: insertedCodes, error: insertError } = await supabaseClient
      .from('promo_codes')
      .insert(codesToInsert)
      .select();

    if (insertError) {
      // If there are duplicates, try to insert one by one
      if (insertError.code === '23505') {
        for (const codeData of codesToInsert) {
          const { data, error } = await supabaseClient
            .from('promo_codes')
            .insert(codeData)
            .select()
            .single();
          
          if (!error && data) {
            createdCodes.push(data);
          }
        }
      } else {
        throw insertError;
      }
    } else {
      createdCodes.push(...(insertedCodes || []));
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${createdCodes.length} promo code(s) generated successfully`,
        codes: createdCodes,
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
