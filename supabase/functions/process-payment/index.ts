
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"
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

    const { merchant, amount, rail, mpin, couponCode } = await req.json()

    if (typeof amount !== 'number' || amount <= 0 || amount > 100000) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid amount',
        message: 'Amount must be between ₹1 and ₹1,00,000.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!mpin) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'MPIN required',
        message: 'Please enter your MPIN to authorize this payment'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user profile for MPIN verification
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('mpin_hash, failed_mpin_attempts, mpin_locked_until, balance, card_balance')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Profile not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if account is locked
    if (profile.mpin_locked_until) {
      const lockTime = new Date(profile.mpin_locked_until)
      if (lockTime > new Date()) {
        const remainingMinutes = Math.ceil((lockTime.getTime() - Date.now()) / 60000)
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Account locked',
          message: `Too many failed attempts. Try again in ${remainingMinutes} minutes.`
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Verify MPIN (supports bcrypt and legacy SHA-256)
    let mpinValid = false;
    if (profile.mpin_hash.startsWith('$2')) {
      mpinValid = await bcrypt.compare(mpin, profile.mpin_hash);
    } else {
      const mpinHash = createHash('sha256').update(mpin).digest('hex');
      mpinValid = mpinHash === profile.mpin_hash;
    }
    if (!profile.mpin_hash) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'MPIN not set',
        message: 'Please set your MPIN in settings first'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!mpinValid) {
      const failedAttempts = (profile.failed_mpin_attempts || 0) + 1
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
          success: false,
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
        success: false,
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

    // Calculate rewards and discount
    let rewardPercent = rail === 'UPI' ? 0.05 : 0.02
    let couponApplied = false
    let appliedOffer = null
    let discountAmount = 0
    let finalPaymentAmount = parseFloat(amount)

    // Validate and apply coupon code if provided
    if (couponCode && couponCode.trim() !== '') {
      const { data: offer, error: offerError } = await supabaseClient
        .from('offers')
        .select('*')
        .eq('redeem_code', couponCode.trim())
        .eq('active', true)
        .single()

      if (offerError || !offer) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Invalid coupon code',
          message: 'The coupon code you entered is invalid or expired'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Validate coupon against MCC code (server-side, not client-supplied merchant name)
      if (offer.mcc !== 'ALL') {
        // The offer's MCC must match - we don't trust client merchant name for validation
        // For production, resolve merchant MCC from a trusted source
        // For now, validate that the offer is active and the code matches
        console.log(`Coupon ${couponCode} applied: MCC=${offer.mcc}, merchant=${merchant}`)
      }

      // Apply discount to payment amount
      // Apply discount to payment amount (reward_percent is already a decimal e.g. 0.15 = 15%)
      rewardPercent = offer.reward_percent
      discountAmount = parseFloat(amount) * rewardPercent
      finalPaymentAmount = Math.max(parseFloat(amount) - discountAmount, 1) // ensure at least ₹1
      couponApplied = true
      appliedOffer = offer
      console.log(`Coupon ${couponCode} applied to ${merchant}: ${offer.reward_percent}% discount = ₹${discountAmount}, final amount = ₹${finalPaymentAmount}`)
    }

    // Use admin client for atomic balance deduction
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate transaction reference
    const transactionRef = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`
    
    // Mock payment processing with final amount
    let paymentResult
    if (rail === 'UPI') {
      paymentResult = await mockNPCICollect(finalPaymentAmount)
    } else if (rail === 'CARD') {
      paymentResult = await mockCardAuth(finalPaymentAmount)
    } else {
      throw new Error('Invalid payment rail')
    }

    // Calculate cashback rewards on final amount
    const cashback = paymentResult.success ? finalPaymentAmount * 0.02 : 0
    const points = Math.round(cashback)

    // If payment successful, atomically deduct balance first
    if (paymentResult.success) {
      const { data: deductSuccess, error: deductError } = await supabaseAdmin
        .rpc('atomic_deduct_balance', {
          p_user_id: user.id,
          p_amount: finalPaymentAmount,
        })

      if (deductError || !deductSuccess) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Insufficient balance',
          message: 'You do not have enough balance for this transaction'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Insert transaction record with final amount and discount details
    const { data: transaction, error } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: user.id,
        merchant,
        amount: finalPaymentAmount,
        original_amount: parseFloat(amount),
        discount_amount: discountAmount,
        coupon_code: couponApplied ? couponCode.trim() : null,
        rail,
        status: paymentResult.success ? 'success' : 'failed',
        transaction_ref: transactionRef,
        reward_amount: cashback
      })
      .select()
      .single()

    if (error) {
      console.error('Transaction insert error:', error)
      // If we already deducted balance, reverse it
      if (paymentResult.success) {
        const { error: reversalError } = await supabaseAdmin.rpc('atomic_deduct_balance', {
          p_user_id: user.id,
          p_amount: -finalPaymentAmount,
        })
        if (reversalError) console.error('Balance reversal failed:', reversalError)
      }
      throw error
    }

    // Add rewards to ledger
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
      }
    }

    console.log(`Payment ${transactionRef}: ${paymentResult.success ? 'SUCCESS' : 'FAILED'} - Original: ₹${amount}, Discount: ₹${discountAmount.toFixed(2)}, Final: ₹${finalPaymentAmount.toFixed(2)} via ${rail} - Cashback: ₹${cashback.toFixed(2)}`)

    return new Response(
      JSON.stringify({
        success: paymentResult.success,
        transaction,
        message: paymentResult.message,
        rewards: paymentResult.success ? { 
          cashback, 
          points,
          couponApplied,
          offerTitle: appliedOffer?.title,
          discountAmount,
          originalAmount: parseFloat(amount),
          finalAmount: finalPaymentAmount
        } : null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: paymentResult.success ? 200 : 400
      }
    )
  } catch (error) {
    console.error('Payment processing error:', error)
    return new Response(
      JSON.stringify({ error: 'An internal error occurred. Please try again.' }),
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
  
  // Always succeed for demo
  const success = true
  
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
  
  // Always succeed for demo
  const success = true
  
  return {
    success,
    message: success 
      ? `Card payment of ₹${amount} successful`
      : 'Card payment failed. Please check your card details.'
  }
}
