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

    const { recipientName, recipientUpi, amount, note } = await req.json();

    // Validate input
    if (!recipientName || !recipientUpi || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid payment details' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate transaction reference
    const transactionRef = `UPI${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Insert transaction record
    const { data: transaction, error: insertError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: user.id,
        merchant: `Transfer to ${recipientName}`,
        amount: amount,
        rail: 'UPI_P2P',
        status: 'pending',
        transaction_ref: transactionRef
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting transaction:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create transaction' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Simulate NPCI P2P API call
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // 90% success rate for P2P payments
    const isSuccess = Math.random() > 0.1;
    const finalStatus = isSuccess ? 'success' : 'failed';

    // Update transaction status
    const { error: updateError } = await supabaseClient
      .from('transactions')
      .update({ 
        status: finalStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Error updating transaction:', updateError);
    }

    console.log(`P2P payment ${transactionRef}: ${finalStatus} - ₹${amount} to ${recipientName} (${recipientUpi})`);

    return new Response(
      JSON.stringify({
        success: isSuccess,
        transactionId: transaction.id,
        transactionRef,
        status: finalStatus,
        amount,
        recipientName,
        recipientUpi,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error processing P2P payment:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})