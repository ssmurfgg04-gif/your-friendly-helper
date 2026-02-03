import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PaystackItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface PaymentRequest {
  items: PaystackItem[];
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod: "card" | "mobile_money" | "apple_pay" | "google_pay";
  currency?: string;
  callbackUrl?: string;
  shippingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
    phone?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      console.error("PAYSTACK_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      items,
      customerEmail,
      customerName,
      customerPhone,
      paymentMethod,
      currency = "KES",
      callbackUrl,
      shippingAddress,
    }: PaymentRequest = await req.json();

    console.log("Paystack payment request:", { customerEmail, paymentMethod, currency, itemCount: items?.length });

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "No items provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!customerEmail) {
      return new Response(
        JSON.stringify({ error: "Customer email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate total in smallest currency unit
    // NOTE: Donations shouldn't include shipping.
    const isDonation = items.every((i) => i.id === "donation");
    const shippingMajor = isDonation ? 0 : 5;
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity * 100, 0);
    const total = subtotal + shippingMajor * 100;

    // Build Paystack channels based on payment method
    let channels: string[] = [];
    switch (paymentMethod) {
      case "mobile_money":
        channels = ["mobile_money"];
        break;
      case "apple_pay":
        channels = ["apple_pay", "card"];
        break;
      case "google_pay":
        channels = ["card"]; // Google Pay works through card channel
        break;
      case "card":
      default:
        channels = ["card"];
    }

    // Create Paystack transaction
    const paystackPayload = {
      email: customerEmail,
      amount: total,
      currency: currency,
      callback_url: callbackUrl || `${req.headers.get("origin")}/checkout/success`,
      channels,
      metadata: {
        custom_fields: [
          {
            display_name: "Customer Name",
            variable_name: "customer_name",
            value: customerName || "Guest",
          },
          {
            display_name: "Items",
            variable_name: "items",
            value: JSON.stringify(items),
          },
          {
            display_name: "Shipping Address",
            variable_name: "shipping_address",
            value: JSON.stringify(shippingAddress || {}),
          },
        ],
        items,
        shipping_address: shippingAddress,
        customer_name: customerName,
        customer_phone: customerPhone,
      },
    };

    // If mobile money with phone number, add mobile money config
    if (paymentMethod === "mobile_money" && customerPhone) {
      Object.assign(paystackPayload, {
        mobile_money: {
          phone: customerPhone,
          provider: "mpesa", // M-Pesa for Kenya
        },
      });
    }

    console.log("Creating Paystack transaction:", { 
      amount: total, 
      currency, 
      channels,
      email: customerEmail 
    });

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackPayload),
    });

    const paystackData = await paystackResponse.json();
    console.log("Paystack response:", { status: paystackData.status, message: paystackData.message });

    if (!paystackData.status) {
      console.error("Paystack error:", paystackData);
      return new Response(
        JSON.stringify({ error: paystackData.message || "Failed to initialize payment" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create pending order in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const orderItems = items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_email: customerEmail,
        user_name: customerName,
        items: orderItems,
        total_amount: total / 100, // Convert back to major unit
        currency,
        status: "pending",
        payment_method: paymentMethod === "mobile_money" ? "mpesa" : "paystack",
        shipping_address: shippingAddress,
        stripe_session_id: paystackData.data.reference, // Store Paystack reference
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
    } else {
      console.log("Order created:", order.id);
    }

    return new Response(
      JSON.stringify({
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: paystackData.data.reference,
        orderId: order?.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Paystack payment error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
