import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, amount, orderId, customerEmail, customerName, items, customerLocation, locationMetadata } = await req.json();
    console.log("M-Pesa STK Push request:", { phone, amount, orderId, customerLocation });

    if (!phone || !amount) {
      throw new Error("Phone number and amount are required");
    }

    const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
    const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");

    if (!consumerKey || !consumerSecret) {
      throw new Error("M-Pesa credentials not configured");
    }

    // Get OAuth token
    const authString = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenResponse = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${authString}`,
        },
      }
    );

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log("M-Pesa OAuth token obtained");

    // Generate timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, 14);

    // Business short code (sandbox)
    const shortCode = "174379";
    const passKey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
    const password = btoa(`${shortCode}${passKey}${timestamp}`);

    // Format phone number (remove leading 0 or +)
    let formattedPhone = phone.replace(/\s/g, "");
    if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.slice(1);
    }
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.slice(1);
    }

    // Initiate STK Push
    const stkResponse = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: Math.round(amount),
          PartyA: formattedPhone,
          PartyB: shortCode,
          PhoneNumber: formattedPhone,
          CallBackURL: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-callback`,
          AccountReference: orderId || "Moenviron",
          TransactionDesc: "Moenviron Purchase",
        }),
      }
    );

    const stkData = await stkResponse.json();
    console.log("M-Pesa STK Push response:", stkData);

    // Create order in database
    if (stkData.ResponseCode === "0" && customerEmail && items) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

const { error: orderError } = await supabase.from("orders").insert({
          user_email: customerEmail,
          user_name: customerName,
          total_amount: amount,
          currency: "KES",
          payment_method: "mpesa",
          mpesa_transaction_id: stkData.CheckoutRequestID,
          items,
          status: "pending",
          customer_location: customerLocation,
          location_metadata: locationMetadata,
        });

      if (orderError) {
        console.error("Error creating order:", orderError);
      }
    }

    return new Response(JSON.stringify(stkData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("M-Pesa error:", error);
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
