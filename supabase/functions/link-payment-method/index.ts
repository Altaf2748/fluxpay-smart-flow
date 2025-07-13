
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

    const { type, ...paymentData } = await req.json()

    if (type === 'UPI') {
      // Link UPI VPA
      const { vpa } = paymentData
      
      if (!vpa || !isValidVPA(vpa)) {
        return new Response(JSON.stringify({ error: 'Invalid VPA format' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data, error } = await supabaseClient
        .from('linked_banks')
        .insert({
          user_id: user.id,
          vpa,
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        console.error('UPI linking error:', error)
        throw error
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } else if (type === 'CARD') {
      // Link Card
      const { cardNumber, expiryMonth, expiryYear, cvv } = paymentData
      
      if (!cardNumber || !expiryMonth || !expiryYear || !cvv) {
        return new Response(JSON.stringify({ error: 'Missing card details' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Mock card tokenization
      const cardToken = `tok_${Date.now()}_${Math.floor(Math.random() * 10000)}`
      const cardLast4 = cardNumber.slice(-4)

      const { data, error } = await supabaseClient
        .from('linked_cards')
        .insert({
          user_id: user.id,
          card_token: cardToken,
          card_last4: cardLast4,
          expiry_month: parseInt(expiryMonth),
          expiry_year: parseInt(expiryYear),
          card_type: 'credit',
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        console.error('Card linking error:', error)
        throw error
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid payment method type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Payment method linking error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

function isValidVPA(vpa: string): boolean {
  const vpaPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+$/
  return vpaPattern.test(vpa)
}
