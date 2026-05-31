import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2024-04-10",
  });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Service role client — webhook is not user-scoped
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const request_id = session.metadata?.request_id;

      if (request_id && session.payment_status === "paid") {
        const { error } = await supabase
          .from("haul_requests")
          .update({ payment_status: "paid" })
          .eq("id", request_id);

        if (error) {
          console.error("Failed to mark payment paid:", error.message);
        } else {
          console.log(`Payment confirmed for request ${request_id}`);
        }
      }
      break;
    }

    case "checkout.session.expired": {
      // Session expired without payment — reset so user can try again
      const session = event.data.object as Stripe.Checkout.Session;
      const request_id = session.metadata?.request_id;

      if (request_id) {
        await supabase
          .from("haul_requests")
          .update({
            payment_status: "unpaid",
            stripe_checkout_session_id: null,
          })
          .eq("id", request_id)
          .eq("payment_status", "pending"); // Only reset if still pending (not if somehow paid)

        console.log(`Checkout session expired for request ${request_id}, reset to unpaid`);
      }
      break;
    }

    case "charge.dispute.created": {
      // Log disputes for manual review
      const dispute = event.data.object as Stripe.Dispute;
      console.error(`DISPUTE created: ${dispute.id} — charge ${dispute.charge} — reason: ${dispute.reason}`);
      // Future: send alert to admin email
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
