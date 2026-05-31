import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLATFORM_FEE_PERCENT = 0.18; // 18% platform fee

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const { request_id, origin } = await req.json();
    if (!request_id || !origin) throw new Error("Missing request_id or origin");

    // User-scoped client — verifies ownership via RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Service-role client — for writing payment status (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    // Fetch request — RLS ensures user owns it
    const { data: haulRequest, error: reqError } = await supabase
      .from("haul_requests")
      .select("id, item_description, pickup_address, dropoff_address, estimated_price, payment_status, status")
      .eq("id", request_id)
      .eq("user_id", user.id)
      .single();

    if (reqError || !haulRequest) throw new Error("Request not found or access denied");
    if (haulRequest.payment_status === "paid") throw new Error("This job has already been paid for");
    if (haulRequest.status === "open") throw new Error("Cannot pay before a hauler claims the job");
    if (haulRequest.status === "cancelled") throw new Error("Cannot pay for a cancelled job");
    if (!haulRequest.estimated_price) throw new Error("Job has no price set");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-04-10",
    });

    const amountCents = Math.round(Number(haulRequest.estimated_price) * 100);
    const platformFeeCents = Math.round(amountCents * PLATFORM_FEE_PERCENT);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `YeeHaul — ${haulRequest.item_description}`,
              description: `${haulRequest.pickup_address} → ${haulRequest.dropoff_address}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/request/${request_id}?payment=success`,
      cancel_url: `${origin}/request/${request_id}?payment=cancelled`,
      metadata: {
        request_id,
        user_id: user.id,
        platform_fee_cents: platformFeeCents.toString(),
      },
    });

    // Mark payment as pending and store session ID
    const { error: updateError } = await supabaseAdmin
      .from("haul_requests")
      .update({
        stripe_checkout_session_id: session.id,
        payment_status: "pending",
        platform_fee: (platformFeeCents / 100).toFixed(2),
      })
      .eq("id", request_id);

    if (updateError) throw new Error("Failed to update payment status");

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("create-checkout-session error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
