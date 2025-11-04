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
    // Check for Authorization header
    const authHeader = req.headers.get('Authorization')
    console.log('Authorization header present:', !!authHeader)
    
    if (!authHeader) {
      console.error('Missing Authorization header')
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Authentication required. Please log in and try again.'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError) {
      console.error('Auth error:', userError.message)
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Invalid or expired session. Please log in again.'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    if (!user) {
      console.error('No user found in session')
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'No active session. Please log in.'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    console.log('User authenticated:', user.id)

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
