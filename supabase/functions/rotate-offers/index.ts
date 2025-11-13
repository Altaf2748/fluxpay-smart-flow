import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const brandOffers = [
  {
    title: "Amazon Sale - 20% Cashback",
    description: "Get 20% cashback on Amazon purchases using FluxPay",
    mcc: "ecommerce",
    reward_percent: 0.20,
    terms: "Valid on purchases above ₹500. Max cashback ₹500"
  },
  {
    title: "Flipkart Big Billion Days",
    description: "Exclusive 15% cashback on Flipkart with FluxPay UPI",
    mcc: "ecommerce",
    reward_percent: 0.15,
    terms: "Valid on purchases above ₹1000. Max cashback ₹1000"
  },
  {
    title: "Swiggy Food Fest - 25% Off",
    description: "Enjoy 25% cashback on all Swiggy orders",
    mcc: "food",
    reward_percent: 0.25,
    terms: "Valid on orders above ₹200. Max cashback ₹200"
  },
  {
    title: "Zomato Gold Offer",
    description: "Get 25% cashback on Zomato dining and delivery",
    mcc: "food",
    reward_percent: 0.25,
    terms: "Valid on orders above ₹300. Max cashback ₹300"
  },
  {
    title: "Nike Store - Flat 20% Back",
    description: "Shop Nike shoes and apparel with 20% cashback",
    mcc: "retail",
    reward_percent: 0.20,
    terms: "Valid on purchases above ₹2000. Max cashback ₹1000"
  },
  {
    title: "Myntra Fashion Sale",
    description: "Myntra fashion haul with 20% instant cashback",
    mcc: "fashion",
    reward_percent: 0.20,
    terms: "Valid on purchases above ₹1500. Max cashback ₹800"
  },
  {
    title: "BookMyShow Movie Bonanza",
    description: "25% cashback on movie ticket bookings",
    mcc: "entertainment",
    reward_percent: 0.25,
    terms: "Valid on bookings above ₹300. Max cashback ₹200"
  },
  {
    title: "Uber Rides Discount",
    description: "Get 15% cashback on all Uber rides",
    mcc: "transport",
    reward_percent: 0.15,
    terms: "Valid on rides above ₹100. Max cashback ₹150"
  },
  {
    title: "Big Bazaar Grocery Deals",
    description: "Save 10% on grocery shopping at Big Bazaar",
    mcc: "grocery",
    reward_percent: 0.10,
    terms: "Valid on purchases above ₹500. Max cashback ₹300"
  },
  {
    title: "Reliance Digital Electronics",
    description: "Massive 10% cashback on electronics and gadgets",
    mcc: "electronics",
    reward_percent: 0.10,
    terms: "Valid on purchases above ₹5000. Max cashback ₹2000"
  },
  {
    title: "Decathlon Sports Sale",
    description: "Get 20% back on sports equipment and gear",
    mcc: "sports",
    reward_percent: 0.20,
    terms: "Valid on purchases above ₹1000. Max cashback ₹500"
  },
  {
    title: "Nykaa Beauty Bonanza",
    description: "25% cashback on beauty and cosmetics",
    mcc: "beauty",
    reward_percent: 0.25,
    terms: "Valid on purchases above ₹800. Max cashback ₹400"
  }
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting offer rotation...')

    // First, check if offers exist with these codes
    const generateCouponCode = (title: string, rewardPercent: number) => {
      const merchantName = title.split(' ')[0].toUpperCase()
      const percent = Math.round(rewardPercent * 100)
      return `${merchantName}${percent}`
    }

    const redeemCodes = brandOffers.map(offer => generateCouponCode(offer.title, offer.reward_percent))
    
    const { data: existingOffers } = await supabaseAdmin
      .from('offers')
      .select('redeem_code')
      .in('redeem_code', redeemCodes)

    const existingCodes = new Set(existingOffers?.map(o => o.redeem_code) || [])

    // Deactivate all existing offers
    const { error: deactivateError } = await supabaseAdmin
      .from('offers')
      .update({ active: false })
      .eq('active', true)

    if (deactivateError) {
      console.error('Error deactivating offers:', deactivateError)
      throw deactivateError
    }

    // Select 5 random offers from the brand offers pool
    const shuffled = [...brandOffers].sort(() => 0.5 - Math.random())
    const selectedOffers = shuffled.slice(0, 5)

    const now = new Date()
    const validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Separate into existing and new offers
    const offersToUpdate: string[] = []
    const offersToInsert: any[] = []

    selectedOffers.forEach(offer => {
      const redeemCode = generateCouponCode(offer.title, offer.reward_percent)
      
      if (existingCodes.has(redeemCode)) {
        offersToUpdate.push(redeemCode)
      } else {
        offersToInsert.push({
          title: offer.title,
          description: offer.description,
          mcc: offer.mcc,
          reward_percent: offer.reward_percent,
          terms: offer.terms,
          valid_from: now.toISOString(),
          valid_to: validUntil.toISOString(),
          active: true,
          redeem_code: redeemCode
        })
      }
    })

    let activatedCount = 0

    // Update existing offers to active
    if (offersToUpdate.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('offers')
        .update({ 
          active: true,
          valid_from: now.toISOString(),
          valid_to: validUntil.toISOString()
        })
        .in('redeem_code', offersToUpdate)

      if (updateError) {
        console.error('Error updating offers:', updateError)
      } else {
        activatedCount += offersToUpdate.length
        console.log(`Activated ${offersToUpdate.length} existing offers`)
      }
    }

    // Insert new offers
    if (offersToInsert.length > 0) {
      const { data: newOffers, error: insertError } = await supabaseAdmin
        .from('offers')
        .insert(offersToInsert)
        .select()

      if (insertError) {
        console.error('Error inserting offers:', insertError)
      } else {
        activatedCount += newOffers?.length || 0
        console.log(`Inserted ${newOffers?.length} new offers`)
      }
    }

    console.log(`Successfully rotated offers. ${activatedCount} offers activated.`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Rotated ${activatedCount} offers`,
        count: activatedCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error rotating offers:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
