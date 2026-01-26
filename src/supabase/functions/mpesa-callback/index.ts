import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendConfirmationEmail(order: { id: string; email: string; items: unknown[]; total: number; customer_name: string }) {
  try {
    const items = Array.isArray(order.items) ? order.items : [];
    
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
          userEmail: order.user_email,
          userName: order.user_name || "",
          items: items,
          totalAmount: order.total_amount,
          currency: order.currency || "KES",
          paymentMethod: "mpesa",
        }),
      }
    );

    if (!emailResponse.ok) {
      console.error("Email sending failed:", await emailResponse.text());
    } else {
      console.log("Confirmation email sent for order:", order.id);
    }
  } catch (emailError) {
    console.error("Email error:", emailError);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("M-Pesa callback received:", JSON.stringify(body));

    const { Body } = body;
    
    if (!Body?.stkCallback) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { stkCallback } = Body;
    const { ResultCode, CheckoutRequestID, CallbackMetadata } = stkCallback;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (ResultCode === 0) {
      // Payment successful
      let mpesaReceiptNumber = "";
      
      if (CallbackMetadata?.Item) {
        const receipt = CallbackMetadata.Item.find(
          (item: { Name: string }) => item.Name === "MpesaReceiptNumber"
        );
        if (receipt) {
          mpesaReceiptNumber = receipt.Value;
        }
      }

      // Update order status and get order details
      const { data: order, error } = await supabase
        .from("orders")
        .update({
          status: "confirmed",
          mpesa_transaction_id: mpesaReceiptNumber || CheckoutRequestID,
        })
        .eq("mpesa_transaction_id", CheckoutRequestID)
        .select()
        .single();

      if (error) {
        console.error("Error updating order:", error);
      } else {
        console.log("Order confirmed:", CheckoutRequestID);
        
        // Send confirmation email
        await sendConfirmationEmail(order);
      }
    } else {
      // Payment failed
      const { error } = await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("mpesa_transaction_id", CheckoutRequestID);

      if (error) {
        console.error("Error updating order:", error);
      } else {
        console.log("Order marked as failed:", CheckoutRequestID);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Callback error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
