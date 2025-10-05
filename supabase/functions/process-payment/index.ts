
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

    const { merchant, amount, rail } = await req.json()
    
    // Generate transaction reference
    const transactionRef = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`
    
    // Mock payment processing
    let paymentResult
    if (rail === 'UPI') {
      // Mock NPCI Collect API
      paymentResult = await mockNPCICollect(amount)
    } else if (rail === 'CARD') {
      // Mock Card Network API
      paymentResult = await mockCardAuth(amount)
    } else {
      throw new Error('Invalid payment rail')
    }

    // Calculate rewards (UPI: 5%, Card: 2%)
    const rewardPercent = rail === 'UPI' ? 0.05 : 0.02
    const cashback = paymentResult.success ? parseFloat(amount) * rewardPercent : 0
    const points = Math.round(cashback)

    // Insert transaction record
    const { data: transaction, error } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: user.id,
        merchant,
        amount: parseFloat(amount),
        rail,
        status: paymentResult.success ? 'success' : 'failed',
        transaction_ref: transactionRef,
        reward_amount: cashback
      })
      .select()
      .single()

    if (error) {
      console.error('Transaction insert error:', error)
      throw error
    }

    // If payment successful, add rewards to ledger
    if (paymentResult.success && cashback > 0) {
      const { error: rewardsError } = await supabaseClient
        .from('rewards_ledger')
        .insert({
          user_id: user.id,
          transaction_id: transaction.id,
          cashback: cashback,
          points: points
        })

      if (rewardsError) {
        console.error('Rewards ledger error:', rewardsError)
        // Don't fail the transaction if rewards fail
      }
    }

    console.log(`Payment ${transactionRef}: ${paymentResult.success ? 'SUCCESS' : 'FAILED'} - ₹${amount} via ${rail} - Cashback: ₹${cashback}`)

    return new Response(
      JSON.stringify({
        success: paymentResult.success,
        transaction,
        message: paymentResult.message,
        rewards: paymentResult.success ? { cashback, points } : null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: paymentResult.success ? 200 : 400
      }
    )
  } catch (error) {
    console.error('Payment processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// Mock NPCI Collect API
async function mockNPCICollect(amount: number) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  // 90% success rate for demo
  const success = Math.random() > 0.1
  
  return {
    success,
    message: success 
      ? `UPI payment of ₹${amount} successful`
      : 'UPI payment failed. Please try again.'
  }
}

// Mock Card Network API
async function mockCardAuth(amount: number) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000))
  
  // 95% success rate for demo
  const success = Math.random() > 0.05
  
  return {
    success,
    message: success 
      ? `Card payment of ₹${amount} successful`
      : 'Card payment failed. Please check your card details.'
  }
}
