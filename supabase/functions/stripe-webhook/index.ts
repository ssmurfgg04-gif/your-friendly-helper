import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ShippingAddress {
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

interface WebhookRequest {
  paymentIntentId: string;
  shippingAddress?: ShippingAddress;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
      console.error("Missing required environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: WebhookRequest = await req.json();
    const { paymentIntentId, shippingAddress } = body;

    console.log("Processing payment confirmation:", paymentIntentId);

    if (!paymentIntentId) {
      return new Response(
        JSON.stringify({ error: "Payment intent ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log("Payment intent status:", paymentIntent.status);

    if (paymentIntent.status !== "succeeded") {
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: paymentIntent.status,
          message: "Payment not completed" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse items from metadata
    let items = [];
    try {
      items = JSON.parse(paymentIntent.metadata?.items || "[]");
    } catch (e) {
      console.error("Error parsing items:", e);
    }

    // Get customer email
    const customerEmail = paymentIntent.receipt_email || "";
    const customerLocation = paymentIntent.metadata?.customerLocation || "";

    // Create order in database
    const orderData = {
      user_email: customerEmail,
      total_amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency?.toUpperCase() || "GBP",
      payment_intent_id: paymentIntentId,
      payment_method: "stripe",
      status: "confirmed",
      items: items,
      shipping_address: shippingAddress || null,
      customer_location: customerLocation,
    };

    console.log("Creating order:", orderData);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      // Don't fail the response - payment was successful
    } else {
      console.log("Order created:", order.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order?.id,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
