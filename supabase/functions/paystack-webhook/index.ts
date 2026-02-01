import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      console.error("PAYSTACK_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Webhook not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify webhook signature using Web Crypto API
    if (signature) {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(PAYSTACK_SECRET_KEY);
      const data = encoder.encode(body);
      
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-512" },
        false,
        ["sign"]
      );
      const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, data);
      const expectedSignature = new TextDecoder().decode(encode(new Uint8Array(signatureBuffer)));
      
      if (signature !== expectedSignature) {
        console.error("Invalid Paystack webhook signature");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const event = JSON.parse(body);
    console.log("Paystack webhook event:", event.event);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (event.event === "charge.success") {
      const { reference, customer, metadata, channel } = event.data;
      
      console.log("Payment successful:", { reference, email: customer?.email, channel });

      // Update order status
      const { data: order, error: updateError } = await supabase
        .from("orders")
        .update({
          status: "confirmed",
          mpesa_transaction_id: channel === "mobile_money" ? reference : null,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_session_id", reference)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating order:", updateError);
      } else {
        console.log("Order updated to confirmed:", order.id);

        // Send confirmation email via Resend if configured
        try {
          const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
          if (RESEND_API_KEY && order.user_email) {
            const emailResponse = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Moenviron <orders@moenviron.com>",
                to: [order.user_email],
                subject: `Order Confirmed - #${order.id.slice(0, 8).toUpperCase()}`,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #16a34a;">Thank you for your order!</h1>
                    <p>Hi ${order.user_name || "there"},</p>
                    <p>Your payment has been confirmed. We're preparing your order now.</p>
                    <p><strong>Order ID:</strong> #${order.id.slice(0, 8).toUpperCase()}</p>
                    <p><strong>Total:</strong> ${order.currency} ${order.total_amount.toFixed(2)}</p>
                    <p><strong>Payment Method:</strong> ${channel === "mobile_money" ? "M-Pesa" : "Card"}</p>
                    <p>Track your order: <a href="https://moenviron.com/order/${order.id}">View Order Status</a></p>
                    <p style="margin-top: 24px;">Thank you for supporting sustainable living!</p>
                    <p>- The Moenviron Team</p>
                  </div>
                `,
              }),
            });
            console.log("Email sent:", await emailResponse.json());
          }
        } catch (emailError) {
          console.error("Error sending confirmation email:", emailError);
        }
      }
    } else if (event.event === "charge.failed") {
      const { reference } = event.data;
      console.log("Payment failed:", reference);

      await supabase
        .from("orders")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_session_id", reference);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Paystack webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Webhook error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
