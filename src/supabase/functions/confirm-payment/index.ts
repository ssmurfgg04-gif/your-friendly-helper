import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShippingAddress {
  name: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
}

interface ConfirmPaymentRequest {
  paymentIntentId: string;
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("Payment system not configured");
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { paymentIntentId, shippingAddress, billingAddress } = await req.json() as ConfirmPaymentRequest;

    console.log("Confirming payment:", paymentIntentId);

    if (!paymentIntentId) {
      throw new Error("Payment intent ID required");
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

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

    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("stripe_session_id", paymentIntentId)
      .maybeSingle();

    if (existingOrder) {
      return new Response(
        JSON.stringify({ success: true, orderId: existingOrder.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const metadata = paymentIntent.metadata || {};
    const customerEmail = metadata.customer_email || paymentIntent.receipt_email || "";
    const customerName = metadata.customer_name || shippingAddress.name || "";
    
    let items = [];
    try {
      items = JSON.parse(metadata.items || "[]");
    } catch {
      console.error("Failed to parse items from metadata");
    }

    const totalAmount = paymentIntent.amount / 100;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        stripe_session_id: paymentIntentId,
        user_email: customerEmail,
        user_name: customerName,
        items: items,
        total_amount: totalAmount,
        currency: "GBP",
        payment_method: "stripe",
        status: "confirmed",
        shipping_address: shippingAddress,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      throw new Error("Failed to save order");
    }

    console.log("Order created:", order.id);

    try {
      const emailResponse = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-order-confirmation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({
            orderId: order.id,
            userEmail: customerEmail,
            userName: customerName,
            items: items,
            totalAmount: totalAmount,
            currency: "GBP",
            paymentMethod: "stripe",
            shippingAddress: shippingAddress,
          }),
        }
      );

      if (!emailResponse.ok) {
        console.error("Email sending failed:", await emailResponse.text());
      }
    } catch (emailError) {
      console.error("Email error:", emailError);
    }

    return new Response(
      JSON.stringify({ success: true, orderId: order.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Confirm payment error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
