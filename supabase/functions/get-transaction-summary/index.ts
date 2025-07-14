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

    const url = new URL(req.url);
    const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);

    // Fetch transactions for the specified month
    const { data: transactions, error } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', `${month}-01`)
      .lt('created_at', `${month}-32`)
      .eq('status', 'success');

    if (error) {
      console.error('Error fetching transactions:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch transactions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Group transactions by day and rail
    const summary = transactions.reduce((acc: any, transaction: any) => {
      const day = transaction.created_at.split('T')[0];
      if (!acc[day]) {
        acc[day] = { upi: 0, card: 0, upi_p2p: 0 };
      }
      
      if (transaction.rail === 'UPI') {
        acc[day].upi += parseFloat(transaction.amount);
      } else if (transaction.rail === 'CARD') {
        acc[day].card += parseFloat(transaction.amount);
      } else if (transaction.rail === 'UPI_P2P') {
        acc[day].upi_p2p += parseFloat(transaction.amount);
      }
      
      return acc;
    }, {});

    // Convert to array format for charts
    const chartData = Object.entries(summary).map(([date, data]: [string, any]) => ({
      date,
      upi: data.upi,
      card: data.card,
      upi_p2p: data.upi_p2p,
      total: data.upi + data.card + data.upi_p2p
    }));

    console.log(`Generated transaction summary for user ${user.id}, month ${month}`);

    return new Response(
      JSON.stringify({ summary: chartData, month }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error generating transaction summary:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})