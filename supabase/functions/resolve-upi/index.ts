import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { identifier } = await req.json()

    if (!identifier) {
      return new Response(JSON.stringify({ error: 'Identifier required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Resolving identifier: ${identifier}`)

    // Use service role key to bypass RLS for user search
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Search for user by phone number
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, first_name, last_name, phone')
      .eq('phone', identifier)
      .single()

    if (profileError || !profile) {
      console.log(`User not found for phone: ${identifier}`)
      return new Response(JSON.stringify({ 
        error: 'User not found',
        message: 'No registered user found with this phone number'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    
    return new Response(JSON.stringify({ 
      name: fullName || 'User',
      userId: profile.user_id,
      phone: profile.phone,
      verified: true
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error resolving identifier:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
