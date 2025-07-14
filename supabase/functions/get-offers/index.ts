import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const mockOffers = [
  {
    id: 1,
    title: "10% Cashback on Groceries",
    description: "Get 10% cashback on all grocery payments using UPI",
    validUntil: "2024-12-31",
    minAmount: 500,
    maxCashback: 200,
    category: "groceries",
    rail: "UPI"
  },
  {
    id: 2,
    title: "No Fee Card Payments",
    description: "Zero processing fee on card payments for this month",
    validUntil: "2024-08-31",
    minAmount: 100,
    maxCashback: 0,
    category: "general",
    rail: "CARD"
  },
  {
    id: 3,
    title: "₹50 Cashback on P2P",
    description: "Send money to friends and get ₹50 cashback",
    validUntil: "2024-09-15",
    minAmount: 1000,
    maxCashback: 50,
    category: "p2p",
    rail: "UPI_P2P"
  },
  {
    id: 4,
    title: "Weekend Special",
    description: "Double rewards on weekend transactions",
    validUntil: "2024-08-25",
    minAmount: 200,
    maxCashback: 500,
    category: "general",
    rail: "ANY"
  }
];

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

    // Filter offers that are still valid
    const activeOffers = mockOffers.filter(offer => 
      new Date(offer.validUntil) > new Date()
    );

    console.log(`Fetched ${activeOffers.length} active offers for user ${user.id}`);

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