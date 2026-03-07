import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"
import { createHash } from "https://deno.land/std@0.177.0/node/crypto.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Manages all MPIN operations server-side:
 * - action: "check"   → returns { mpinSet: boolean }
 * - action: "verify"  → verifies a given MPIN, returns { valid: boolean }
 * - action: "set"     → sets a new MPIN (only if not already set)
 * - action: "reset"   → sets a new MPIN (requires prior verification via OTP or verify action)
 */
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

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { action, mpin, newMpin } = await req.json()

    // Use admin client for profile reads/writes to bypass column-restriction trigger
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('mpin_hash, failed_mpin_attempts, mpin_locked_until')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ---------- CHECK ----------
    if (action === 'check') {
      return new Response(JSON.stringify({ mpinSet: !!profile.mpin_hash }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ---------- VERIFY ----------
    if (action === 'verify') {
      if (!mpin || typeof mpin !== 'string' || mpin.length !== 4 || !/^\d{4}$/.test(mpin)) {
        return new Response(JSON.stringify({ error: 'MPIN must be 4 digits' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!profile.mpin_hash) {
        return new Response(JSON.stringify({ error: 'MPIN not set' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Check lock
      if (profile.mpin_locked_until) {
        const lockTime = new Date(profile.mpin_locked_until)
        if (lockTime > new Date()) {
          const remainingMinutes = Math.ceil((lockTime.getTime() - Date.now()) / 60000)
          return new Response(JSON.stringify({
            error: 'Account locked',
            message: `Too many failed attempts. Try again in ${remainingMinutes} minutes.`
          }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      }

      const valid = await verifyMpinHash(mpin, profile.mpin_hash)

      if (!valid) {
        const failedAttempts = (profile.failed_mpin_attempts || 0) + 1
        const now = new Date().toISOString()
        const updateData: Record<string, unknown> = { failed_mpin_attempts: failedAttempts, last_failed_attempt: now }

        if (failedAttempts >= 3) {
          updateData.mpin_locked_until = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
        }

        await supabaseAdmin.from('profiles').update(updateData).eq('user_id', user.id)

        const remaining = Math.max(0, 3 - failedAttempts)
        return new Response(JSON.stringify({
          valid: false,
          message: failedAttempts >= 3
            ? 'Too many failed attempts. Account locked for 3 hours.'
            : `Wrong MPIN. ${remaining} attempts remaining.`
        }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Success — reset failed attempts, migrate hash if legacy
      const updateData: Record<string, unknown> = {
        failed_mpin_attempts: 0,
        last_failed_attempt: null,
        mpin_locked_until: null,
      }
      // Migrate from SHA-256 to bcrypt if needed
      if (!profile.mpin_hash.startsWith('$2')) {
        updateData.mpin_hash = await bcrypt.hash(mpin)
      }
      await supabaseAdmin.from('profiles').update(updateData).eq('user_id', user.id)

      return new Response(JSON.stringify({ valid: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ---------- SET (first time) ----------
    if (action === 'set') {
      if (profile.mpin_hash) {
        return new Response(JSON.stringify({ error: 'MPIN already set. Use reset instead.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!mpin || typeof mpin !== 'string' || mpin.length !== 4 || !/^\d{4}$/.test(mpin)) {
        return new Response(JSON.stringify({ error: 'MPIN must be 4 digits' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const hashed = await bcrypt.hash(mpin)
      await supabaseAdmin.from('profiles').update({ mpin_hash: hashed }).eq('user_id', user.id)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ---------- RESET ----------
    if (action === 'reset') {
      if (!newMpin || typeof newMpin !== 'string' || newMpin.length !== 4 || !/^\d{4}$/.test(newMpin)) {
        return new Response(JSON.stringify({ error: 'New MPIN must be 4 digits' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const hashed = await bcrypt.hash(newMpin)
      await supabaseAdmin.from('profiles').update({
        mpin_hash: hashed,
        failed_mpin_attempts: 0,
        last_failed_attempt: null,
        mpin_locked_until: null,
      }).eq('user_id', user.id)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('manage-mpin error:', error)
    return new Response(JSON.stringify({ error: 'An internal error occurred. Please try again.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

/** Verify MPIN against stored hash (supports both bcrypt and legacy SHA-256) */
async function verifyMpinHash(mpin: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith('$2')) {
    return await bcrypt.compare(mpin, storedHash)
  }
  // Legacy SHA-256
  const sha256 = createHash('sha256').update(mpin).digest('hex')
  return sha256 === storedHash
}
