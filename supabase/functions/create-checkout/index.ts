import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
  mode?: "payment" | "payment_intent" | "checkout_session";
  isDonation?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment system not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate key format
    if (stripeSecretKey.startsWith("pk_")) {
      console.error("Invalid key: STRIPE_SECRET_KEY contains publishable key");
      return new Response(
        JSON.stringify({ error: "Invalid payment configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const body: CheckoutRequest = await req.json();
    const { items, customerEmail, customerName, customerLocation, mode = "payment_intent", isDonation = false } = body;

    console.log("Creating checkout:", { itemsCount: items?.length, customerEmail, mode, isDonation });

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "No items provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!customerEmail) {
      return new Response(
        JSON.stringify({ error: "Customer email required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate total
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = isDonation ? 0 : 5; // No shipping for donations
    const totalAmount = Math.round((subtotal + shipping) * 100); // Convert to pence

    // For payment_intent mode (embedded checkout)
    if (mode === "payment_intent") {
      console.log("Creating payment intent for amount:", totalAmount);

      // Check for existing customer
      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
      let customerId: string;

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log("Found existing customer:", customerId);
      } else {
        const newCustomer = await stripe.customers.create({
          email: customerEmail,
          name: customerName || undefined,
          metadata: { location: customerLocation || "" },
        });
        customerId = newCustomer.id;
        console.log("Created new customer:", customerId);
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: "gbp",
        customer: customerId,
        receipt_email: customerEmail,
        metadata: {
          items: JSON.stringify(items.map(i => ({ id: i.id, name: i.name, qty: i.quantity }))),
          customerLocation: customerLocation || "",
        },
        // Enable card, Apple Pay, Google Pay, and PayPal
        payment_method_types: ["card", "paypal", "link"],
      });

      console.log("Payment intent created:", paymentIntent.id);

      return new Response(
        JSON.stringify({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For checkout_session or payment mode (redirect flow)
    const origin = req.headers.get("origin") || "https://gentle-response-app.lovable.app";

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "gbp",
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // Add shipping as a line item only for non-donations
    if (!isDonation) {
      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: { name: "Shipping" },
          unit_amount: 500,
        },
        quantity: 1,
      });
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card", "paypal", "link"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      customer_email: customerEmail,
      metadata: {
        items: JSON.stringify(items.map(i => ({ id: i.id, name: i.name, qty: i.quantity }))),
        customerName: customerName || "",
        customerLocation: customerLocation || "",
        isDonation: isDonation ? "true" : "false",
      },
    };

    // Only collect shipping address for non-donations
    if (!isDonation) {
      sessionConfig.shipping_address_collection = {
        allowed_countries: ["GB", "KE", "US", "UG", "TZ", "RW", "NG", "ZA", "GH", "ET"],
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log("Checkout session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Checkout error:", error);
    const message = error instanceof Error ? error.message : "Failed to create checkout";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
