import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const brandOffers = [
  { title: "Amazon Sale - 20% Cashback", description: "Get 20% cashback on Amazon purchases", mcc: "ecommerce", reward_percent: 0.20, terms: "Valid on purchases above ₹500" },
  { title: "Flipkart Big Billion Days", description: "Exclusive 15% cashback on Flipkart", mcc: "ecommerce", reward_percent: 0.15, terms: "Valid on purchases above ₹1000" },
  { title: "Swiggy Food Fest - 25% Off", description: "Enjoy 25% cashback on all Swiggy orders", mcc: "food", reward_percent: 0.25, terms: "Valid on orders above ₹200" },
  { title: "Zomato Gold Offer", description: "Get 25% cashback on Zomato dining", mcc: "food", reward_percent: 0.25, terms: "Valid on orders above ₹300" },
  { title: "Nike Store - Flat 20% Back", description: "Shop Nike with 20% cashback", mcc: "retail", reward_percent: 0.20, terms: "Valid on purchases above ₹2000" },
  { title: "Myntra Fashion Sale", description: "Myntra fashion with 20% cashback", mcc: "fashion", reward_percent: 0.20, terms: "Valid on purchases above ₹1500" },
  { title: "BookMyShow Movie Bonanza", description: "25% cashback on movie tickets", mcc: "entertainment", reward_percent: 0.25, terms: "Valid on bookings above ₹300" },
  { title: "Uber Rides Discount", description: "Get 15% cashback on all Uber rides", mcc: "transport", reward_percent: 0.15, terms: "Valid on rides above ₹100" },
  { title: "Big Bazaar Grocery Deals", description: "Save 10% on Big Bazaar grocery", mcc: "grocery", reward_percent: 0.10, terms: "Valid on purchases above ₹500" },
  { title: "Reliance Digital Electronics", description: "10% cashback on electronics", mcc: "electronics", reward_percent: 0.10, terms: "Valid on purchases above ₹5000" },
  { title: "Decathlon Sports Sale", description: "Get 20% back on sports equipment", mcc: "sports", reward_percent: 0.20, terms: "Valid on purchases above ₹1000" },
  { title: "Nykaa Beauty Bonanza", description: "25% cashback on beauty products", mcc: "beauty", reward_percent: 0.25, terms: "Valid on purchases above ₹800" },
  { title: "Starbucks Coffee Rewards", description: "15% cashback on Starbucks", mcc: "food", reward_percent: 0.15, terms: "Valid on orders above ₹200" },
  { title: "Netflix Streaming Deal", description: "10% cashback on Netflix subscriptions", mcc: "entertainment", reward_percent: 0.10, terms: "Valid on all subscriptions" },
  { title: "Spotify Premium Offer", description: "10% cashback on Spotify Premium", mcc: "entertainment", reward_percent: 0.10, terms: "Valid on all plans" },
  { title: "Apple Store Savings", description: "10% cashback on Apple products", mcc: "electronics", reward_percent: 0.10, terms: "Valid on purchases above ₹5000" },
  { title: "Google Play Credits", description: "15% cashback on Google Play", mcc: "entertainment", reward_percent: 0.15, terms: "Valid on all purchases" },
  { title: "Steam Gaming Deals", description: "20% cashback on Steam games", mcc: "entertainment", reward_percent: 0.20, terms: "Valid on purchases above ₹500" },
  { title: "Adidas Sports Special", description: "20% cashback on Adidas products", mcc: "retail", reward_percent: 0.20, terms: "Valid on purchases above ₹2000" },
  { title: "Zara Fashion Week", description: "15% cashback on Zara fashion", mcc: "fashion", reward_percent: 0.15, terms: "Valid on purchases above ₹2000" },
  { title: "H&M Style Rewards", description: "15% cashback on H&M purchases", mcc: "fashion", reward_percent: 0.15, terms: "Valid on purchases above ₹1500" },
  { title: "McDonald's Meal Deals", description: "20% cashback on McDonald's", mcc: "food", reward_percent: 0.20, terms: "Valid on orders above ₹150" },
  { title: "KFC Feast Offer", description: "20% cashback on KFC orders", mcc: "food", reward_percent: 0.20, terms: "Valid on orders above ₹200" },
  { title: "Domino's Pizza Party", description: "25% cashback on Domino's pizza", mcc: "food", reward_percent: 0.25, terms: "Valid on orders above ₹300" },
  { title: "Pizza Hut Specials", description: "25% cashback on Pizza Hut", mcc: "food", reward_percent: 0.25, terms: "Valid on orders above ₹300" },
  { title: "Subway Fresh Deals", description: "15% cashback on Subway", mcc: "food", reward_percent: 0.15, terms: "Valid on orders above ₹150" },
  { title: "Ola Ride Rewards", description: "15% cashback on Ola rides", mcc: "transport", reward_percent: 0.15, terms: "Valid on rides above ₹100" },
  { title: "PVR Movie Magic", description: "20% cashback on PVR tickets", mcc: "entertainment", reward_percent: 0.20, terms: "Valid on bookings above ₹300" },
  { title: "BigBasket Grocery Savings", description: "10% cashback on BigBasket", mcc: "grocery", reward_percent: 0.10, terms: "Valid on orders above ₹500" },
  { title: "Grofers Fresh Deals", description: "10% cashback on Grofers", mcc: "grocery", reward_percent: 0.10, terms: "Valid on orders above ₹500" },
  { title: "DMart Shopping Rewards", description: "8% cashback on DMart", mcc: "grocery", reward_percent: 0.08, terms: "Valid on purchases above ₹500" },
  { title: "Croma Electronics Fest", description: "10% cashback on Croma", mcc: "electronics", reward_percent: 0.10, terms: "Valid on purchases above ₹5000" },
  { title: "Samsung Galaxy Deals", description: "12% cashback on Samsung", mcc: "electronics", reward_percent: 0.12, terms: "Valid on purchases above ₹10000" },
  { title: "OnePlus Tech Offers", description: "12% cashback on OnePlus", mcc: "electronics", reward_percent: 0.12, terms: "Valid on purchases above ₹10000" },
  { title: "Xiaomi Smart Savings", description: "10% cashback on Xiaomi", mcc: "electronics", reward_percent: 0.10, terms: "Valid on purchases above ₹5000" },
  { title: "Ajio Fashion Express", description: "18% cashback on Ajio", mcc: "fashion", reward_percent: 0.18, terms: "Valid on purchases above ₹1500" },
  { title: "Lifestyle Shopping Spree", description: "15% cashback on Lifestyle", mcc: "fashion", reward_percent: 0.15, terms: "Valid on purchases above ₹2000" },
  { title: "Pantaloons Style Days", description: "15% cashback on Pantaloons", mcc: "fashion", reward_percent: 0.15, terms: "Valid on purchases above ₹1500" },
  { title: "Titan Timepiece Offer", description: "10% cashback on Titan watches", mcc: "retail", reward_percent: 0.10, terms: "Valid on purchases above ₹3000" },
  { title: "Tanishq Jewellery Fest", description: "8% cashback on Tanishq", mcc: "retail", reward_percent: 0.08, terms: "Valid on purchases above ₹10000" },
  { title: "Kalyan Jewellers Gold", description: "8% cashback on Kalyan", mcc: "retail", reward_percent: 0.08, terms: "Valid on purchases above ₹10000" },
  { title: "HP Computing Deals", description: "10% cashback on HP products", mcc: "electronics", reward_percent: 0.10, terms: "Valid on purchases above ₹15000" },
  { title: "Dell Tech Rewards", description: "10% cashback on Dell laptops", mcc: "electronics", reward_percent: 0.10, terms: "Valid on purchases above ₹15000" },
  { title: "Lenovo Power Savings", description: "10% cashback on Lenovo", mcc: "electronics", reward_percent: 0.10, terms: "Valid on purchases above ₹15000" },
  { title: "Asus Gaming Bonanza", description: "12% cashback on Asus products", mcc: "electronics", reward_percent: 0.12, terms: "Valid on purchases above ₹20000" },
  { title: "Acer Tech Specials", description: "10% cashback on Acer", mcc: "electronics", reward_percent: 0.10, terms: "Valid on purchases above ₹15000" },
  { title: "Sony Entertainment Hub", description: "10% cashback on Sony", mcc: "electronics", reward_percent: 0.10, terms: "Valid on purchases above ₹10000" },
  { title: "LG Appliance Deals", description: "10% cashback on LG appliances", mcc: "electronics", reward_percent: 0.10, terms: "Valid on purchases above ₹10000" },
  { title: "Philips Home Care", description: "12% cashback on Philips", mcc: "electronics", reward_percent: 0.12, terms: "Valid on purchases above ₹5000" },
  { title: "Boat Audio Fest", description: "15% cashback on Boat audio", mcc: "electronics", reward_percent: 0.15, terms: "Valid on purchases above ₹1000" },
  { title: "JBL Sound Rewards", description: "15% cashback on JBL products", mcc: "electronics", reward_percent: 0.15, terms: "Valid on purchases above ₹2000" },
  { title: "Bose Premium Audio", description: "12% cashback on Bose", mcc: "electronics", reward_percent: 0.12, terms: "Valid on purchases above ₹5000" }
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

    console.log('Starting offer activation...')

    // Generate coupon codes based on merchant name and reward percent
    const generateCouponCode = (title: string, rewardPercent: number) => {
      const merchantName = title.split(' ')[0].toUpperCase()
      const percent = Math.round(rewardPercent * 100)
      return `${merchantName}${percent}`
    }

    const now = new Date()
    const farFuture = new Date('2099-12-31')
    
    let activatedCount = 0
    let createdCount = 0

    // Process all brand offers - either update existing or insert new
    for (const offer of brandOffers) {
      const redeemCode = generateCouponCode(offer.title, offer.reward_percent)
      
      // Try to update existing offer first
      const { data: existing, error: selectError } = await supabaseAdmin
        .from('offers')
        .select('id')
        .eq('redeem_code', redeemCode)
        .single()

      if (existing) {
        // Update existing offer to be active with perpetual validity
        const { error: updateError } = await supabaseAdmin
          .from('offers')
          .update({
            title: offer.title,
            description: offer.description,
            mcc: offer.mcc,
            reward_percent: offer.reward_percent,
            terms: offer.terms,
            valid_from: now.toISOString(),
            valid_to: farFuture.toISOString(),
            active: true
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error(`Error updating offer ${redeemCode}:`, updateError)
        } else {
          activatedCount++
        }
      } else {
        // Insert new offer with perpetual validity
        const { error: insertError } = await supabaseAdmin
          .from('offers')
          .insert({
            title: offer.title,
            description: offer.description,
            mcc: offer.mcc,
            reward_percent: offer.reward_percent,
            terms: offer.terms,
            valid_from: now.toISOString(),
            valid_to: farFuture.toISOString(),
            active: true,
            redeem_code: redeemCode
          })

        if (insertError) {
          console.error(`Error inserting offer ${redeemCode}:`, insertError)
        } else {
          createdCount++
        }
      }
    }

    console.log(`Successfully processed offers. Activated: ${activatedCount}, Created: ${createdCount}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed offers: ${activatedCount} activated, ${createdCount} created`,
        stats: { activated: activatedCount, created: createdCount }
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
