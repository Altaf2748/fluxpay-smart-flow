import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch active offers from database
    const { data: offers, error: offersError } = await supabaseClient
      .from('offers')
      .select('*')
      .eq('active', true)
      .gte('valid_to', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (offersError) {
      console.error('Error fetching offers:', offersError)
      return new Response(JSON.stringify({ error: 'Failed to fetch offers' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Transform database offers to match frontend format
    const activeOffers = (offers || []).map(offer => ({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      validUntil: offer.valid_to,
      minAmount: 0,
      maxCashback: Math.round(offer.reward_percent * 1000),
      category: offer.mcc,
      rail: 'UPI',
      redeemCode: offer.redeem_code
    }))

    console.log(`Fetched ${activeOffers.length} active offers for user ${user.id}`)

    return new Response(
      JSON.stringify({ offers: activeOffers }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error fetching offers:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})