import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CheckoutRequest {
  items: CartItem[];
  customerEmail: string;
  customerName?: string;
  customerLocation?: string;
  locationMetadata?: { country?: string; city?: string };
  mode?: "checkout_session" | "payment_intent";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY not configured");
      throw new Error("Payment system not configured");
    }

const stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2024-11-20.acacia",
      });

    const { items, customerEmail, customerName, customerLocation, locationMetadata, mode = "payment_intent" } = await req.json() as CheckoutRequest;

    console.log("Creating payment for:", customerEmail);
    console.log("Items:", JSON.stringify(items));
    console.log("Mode:", mode);

    if (!items || items.length === 0) {
      throw new Error("No items in cart");
    }

    if (!customerEmail) {
      throw new Error("Customer email is required");
    }

    if (mode === "payment_intent") {
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shippingStandard = 5;
      const totalAmount = Math.round((subtotal + shippingStandard) * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: "gbp",
        automatic_payment_methods: { enabled: true },
        metadata: {
          customer_email: customerEmail,
          customer_name: customerName || "",
          items: JSON.stringify(items.map(i => ({ id: i.id, name: i.name, qty: i.quantity, price: i.price }))),
        },
        receipt_email: customerEmail,
      });

      console.log("Payment intent created:", paymentIntent.id);

      return new Response(
        JSON.stringify({ 
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: totalAmount,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "gbp",
        product_data: {
          name: item.name,
          metadata: {
            product_id: item.id,
          },
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const origin = req.headers.get("origin") || "https://moenviron.com";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      customer_email: customerEmail,
      metadata: {
        customer_name: customerName || "",
        customer_location: customerLocation || "",
        location_metadata: JSON.stringify(locationMetadata || {}),
      },
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: [
          "GB", "US", "CA", "AU", "NZ", "DE", "FR", "IT", "ES", "NL", "BE", "AT", "CH", "IE", "PT",
          "KE", "TZ", "UG", "RW", "ET", "NG", "ZA", "GH", "EG", "MA", "SN",
          "JP", "KR", "SG", "AE", "SA", "IN", "BR", "MX", "AR", "CL"
        ],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 500, currency: "gbp" },
            display_name: "Standard Shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 5 },
              maximum: { unit: "business_day", value: 10 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 1500, currency: "gbp" },
            display_name: "Express Shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 2 },
              maximum: { unit: "business_day", value: 5 },
            },
          },
        },
      ],
      phone_number_collection: {
        enabled: true,
      },
    });

    console.log("Checkout session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Checkout error:", error);
    const message = error instanceof Error ? error.message : "Checkout failed";
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
