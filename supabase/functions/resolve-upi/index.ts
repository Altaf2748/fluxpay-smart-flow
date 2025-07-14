import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mock UPI resolution data
const mockUpiData: { [key: string]: { name: string; upiId: string } } = {
  "9876543210": { name: "John Doe", upiId: "john.doe@paytm" },
  "8765432109": { name: "Jane Smith", upiId: "jane.smith@phonepe" },
  "7654321098": { name: "Alice Johnson", upiId: "alice.j@googlepay" },
  "john.doe@paytm": { name: "John Doe", upiId: "john.doe@paytm" },
  "jane.smith@phonepe": { name: "Jane Smith", upiId: "jane.smith@phonepe" },
  "alice.j@googlepay": { name: "Alice Johnson", upiId: "alice.j@googlepay" },
  "test@upi": { name: "Test User", upiId: "test@upi" }
};

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

    const url = new URL(req.url);
    const identifier = url.searchParams.get('identifier'); // mobile number or UPI ID

    if (!identifier) {
      return new Response(JSON.stringify({ error: 'Missing identifier parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Check if identifier exists in mock data
    const resolvedData = mockUpiData[identifier];
    
    if (!resolvedData) {
      // 20% chance of failure for demo purposes
      if (Math.random() < 0.2) {
        return new Response(JSON.stringify({ 
          error: 'UPI ID not found or invalid',
          success: false 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      // Generate random name for unknown identifiers
      const randomNames = ["Rajesh Kumar", "Priya Sharma", "Amit Patel", "Sneha Gupta", "Vikash Singh"];
      const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
      const upiId = identifier.includes('@') ? identifier : `${identifier}@paytm`;
      
      console.log(`Resolved unknown identifier ${identifier} to ${randomName}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          name: randomName,
          upiId: upiId,
          verified: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    console.log(`Resolved identifier ${identifier} to ${resolvedData.name}`);

    return new Response(
      JSON.stringify({
        success: true,
        name: resolvedData.name,
        upiId: resolvedData.upiId,
        verified: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error resolving UPI:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})