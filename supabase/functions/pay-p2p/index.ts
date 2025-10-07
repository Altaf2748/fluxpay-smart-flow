import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHash } from "https://deno.land/std@0.177.0/node/crypto.ts"

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

    const { recipientId, amount, note, mpin } = await req.json()

    if (!recipientId || !amount || !mpin) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get sender profile
    const { data: senderProfile, error: senderError } = await supabaseClient
      .from('profiles')
      .select('balance, mpin_hash, failed_mpin_attempts, mpin_locked_until')
      .eq('user_id', user.id)
      .single()

    if (senderError || !senderProfile) {
      return new Response(JSON.stringify({ error: 'Sender profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if account is locked
    if (senderProfile.mpin_locked_until) {
      const lockTime = new Date(senderProfile.mpin_locked_until)
      if (lockTime > new Date()) {
        const remainingMinutes = Math.ceil((lockTime.getTime() - Date.now()) / 60000)
        return new Response(JSON.stringify({ 
          error: 'Account locked',
          message: `Too many failed attempts. Try again in ${remainingMinutes} minutes.`
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Verify MPIN
    const mpinHash = createHash('sha256').update(mpin).digest('hex')
    if (!senderProfile.mpin_hash) {
      return new Response(JSON.stringify({ 
        error: 'MPIN not set',
        message: 'Please set your MPIN in settings first'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (mpinHash !== senderProfile.mpin_hash) {
      const failedAttempts = (senderProfile.failed_mpin_attempts || 0) + 1
      const now = new Date().toISOString()
      
      if (failedAttempts >= 3) {
        const lockUntil = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
        await supabaseClient
          .from('profiles')
          .update({ 
            failed_mpin_attempts: failedAttempts,
            last_failed_attempt: now,
            mpin_locked_until: lockUntil
          })
          .eq('user_id', user.id)
        
        return new Response(JSON.stringify({ 
          error: 'Account locked',
          message: 'Too many failed attempts. Account locked for 3 hours.'
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      await supabaseClient
        .from('profiles')
        .update({ 
          failed_mpin_attempts: failedAttempts,
          last_failed_attempt: now
        })
        .eq('user_id', user.id)

      return new Response(JSON.stringify({ 
        error: 'Invalid MPIN',
        message: `Wrong MPIN. ${3 - failedAttempts} attempts remaining.`
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Reset failed attempts on successful MPIN
    await supabaseClient
      .from('profiles')
      .update({ 
        failed_mpin_attempts: 0,
        last_failed_attempt: null,
        mpin_locked_until: null
      })
      .eq('user_id', user.id)

    // Check balance
    if (senderProfile.balance < amount) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient balance',
        message: 'You do not have enough balance for this transaction'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get recipient profile - use admin client to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: recipientProfile, error: recipientError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, first_name, last_name')
      .eq('user_id', recipientId)
      .single()

    if (recipientError || !recipientProfile) {
      console.error('Recipient not found:', recipientError)
      return new Response(JSON.stringify({ error: 'Recipient not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const recipientName = `${recipientProfile.first_name || ''} ${recipientProfile.last_name || ''}`.trim()
    const transactionRef = `P2P${Date.now()}`

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: user.id,
        recipient_id: recipientId,
        amount: amount,
        merchant: recipientName || 'User',
        rail: 'UPI',
        transaction_type: 'p2p',
        transaction_ref: transactionRef,
        status: 'success'
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Transaction error:', transactionError)
      return new Response(JSON.stringify({ error: 'Transaction failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update sender's balance (deduct amount)
    const { error: senderBalanceError } = await supabaseClient
      .from('profiles')
      .update({ 
        balance: parseFloat(senderProfile.balance) - amount
      })
      .eq('user_id', user.id)

    if (senderBalanceError) {
      console.error('Sender balance update error:', senderBalanceError)
    }

    // Update recipient's balance (add amount) - admin client already initialized above
    const { data: recipientBalanceData, error: recipientBalanceError } = await supabaseAdmin
      .from('profiles')
      .select('balance')
      .eq('user_id', recipientId)
      .single()

    if (!recipientBalanceError && recipientBalanceData) {
      await supabaseAdmin
        .from('profiles')
        .update({ 
          balance: parseFloat(recipientBalanceData.balance) + amount
        })
        .eq('user_id', recipientId)
    }

    console.log(`P2P payment successful: ${user.id} -> ${recipientId}, amount: ${amount}`)

    return new Response(JSON.stringify({ 
      success: true,
      transaction_ref: transactionRef,
      message: 'Payment sent successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error processing P2P payment:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
