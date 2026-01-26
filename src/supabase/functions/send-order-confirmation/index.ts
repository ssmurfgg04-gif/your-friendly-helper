import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function getResendApiKey(): Promise<string> {
  const envKey = Deno.env.get("RESEND_API_KEY");
  if (envKey) return envKey;
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
  
  const { data } = await supabase
    .from("site_content")
    .select("content")
    .eq("section_key", "resend")
    .single();
  
  return (data?.content as Record<string, string>)?.api_key || "";
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface ShippingAddress {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
}

interface OrderConfirmationRequest {
  orderId: string;
  userEmail: string;
  userName: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  shippingAddress?: ShippingAddress;
  estimatedDelivery?: string;
  siteUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = await getResendApiKey();
    if (!apiKey) {
      throw new Error("Resend API key not configured");
    }
    const resend = new Resend(apiKey);

    const { 
      orderId, 
      userEmail, 
      userName, 
      items, 
      totalAmount, 
      currency, 
      paymentMethod,
      shippingAddress,
      estimatedDelivery,
      siteUrl = "https://moenviron.com"
    }: OrderConfirmationRequest = await req.json();

    console.log("Sending order confirmation email to:", userEmail);

    const currencySymbol = currency === "GBP" ? "£" : currency === "KES" ? "KSh" : "$";
    const shortOrderId = orderId.slice(0, 8).toUpperCase();
    const orderDate = new Date().toLocaleDateString("en-US", { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
    
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 16px 12px; border-bottom: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 60px; height: 60px; background-color: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
              ${item.image 
                ? `<img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" />`
                : `<span style="font-size: 24px;">📦</span>`
              }
            </div>
            <div>
              <p style="margin: 0; font-weight: 500; color: #1f2937;">${item.name}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">Qty: ${item.quantity}</p>
            </div>
          </div>
        </td>
        <td style="padding: 16px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #1f2937;">
          ${currencySymbol}${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join("");

    const shippingHtml = shippingAddress ? `
      <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">
          📍 Shipping Address
        </h3>
        <div style="color: #4b5563; font-size: 15px; line-height: 1.6;">
          ${shippingAddress.name ? `<p style="margin: 0; font-weight: 600; color: #1f2937;">${shippingAddress.name}</p>` : ''}
          ${shippingAddress.line1 ? `<p style="margin: 4px 0 0 0;">${shippingAddress.line1}</p>` : ''}
          ${shippingAddress.line2 ? `<p style="margin: 0;">${shippingAddress.line2}</p>` : ''}
          <p style="margin: 0;">
            ${[shippingAddress.city, shippingAddress.postal_code].filter(Boolean).join(", ")}
          </p>
          ${shippingAddress.country ? `<p style="margin: 0;">${shippingAddress.country}</p>` : ''}
          ${shippingAddress.phone ? `<p style="margin: 8px 0 0 0; font-size: 14px;">📞 ${shippingAddress.phone}</p>` : ''}
        </div>
      </div>
    ` : '';

    const estimatedDeliveryHtml = estimatedDelivery ? `
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #065f46;">
          🚚 <strong>Estimated Delivery:</strong> ${new Date(estimatedDelivery).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>
    ` : '';

    const emailResponse = await resend.emails.send({
      from: "Moenviron <orders@moenviron.com>",
      to: [userEmail],
      subject: `Order Confirmed! 🎉 #${shortOrderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9fafb;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 40px 24px; text-align: center;">
            <div style="display: inline-block; background-color: rgba(255,255,255,0.2); border-radius: 50%; padding: 16px; margin-bottom: 16px;">
              <span style="font-size: 32px;">🌿</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Thank You for Your Order!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">We're preparing it with care</p>
          </div>
          
          <!-- Content -->
          <div style="background-color: white; padding: 32px 24px;">
            
            <!-- Greeting -->
            <p style="font-size: 18px; margin: 0 0 24px 0;">
              Hi <strong>${userName || "there"}</strong>,
            </p>
            
            <p style="margin: 0 0 24px 0; color: #4b5563;">
              Great news! Your order has been confirmed and is being processed. Here's everything you need to know:
            </p>
            
            <!-- Order Info Box -->
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Order ID</span><br>
                    <span style="font-size: 20px; font-weight: 700; color: #059669; font-family: monospace;">#${shortOrderId}</span>
                  </td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Order Date</span><br>
                    <span style="font-size: 15px; font-weight: 500; color: #1f2937;">${orderDate}</span>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 12px 0 0 0; border-top: 1px dashed #a7f3d0;">
                    <span style="font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Payment Method</span><br>
                    <span style="font-size: 15px; font-weight: 500; color: #1f2937;">${paymentMethod === "mpesa" ? "M-Pesa Mobile Money" : "💳 Card Payment"}</span>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Track Order Button -->
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${siteUrl}/orders/${orderId}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.3);">
                📦 Track Your Order
              </a>
            </div>
            
            ${estimatedDeliveryHtml}
            
            <!-- Order Items -->
            <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">
              Order Summary
            </h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background-color: #fafafa; border-radius: 12px; overflow: hidden;">
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr style="background-color: #f3f4f6;">
                  <td style="padding: 16px 12px; font-weight: 600; color: #374151;">Total</td>
                  <td style="padding: 16px 12px; text-align: right; font-weight: 700; font-size: 20px; color: #059669;">
                    ${currencySymbol}${totalAmount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
            
            ${shippingHtml}
            
            <!-- What's Next -->
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">
                What Happens Next?
              </h3>
              <div style="color: #4b5563; font-size: 15px;">
                <p style="margin: 0 0 12px 0; display: flex; align-items: flex-start; gap: 12px;">
                  <span style="background-color: #059669; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0;">1</span>
                  <span>We're preparing your order with care</span>
                </p>
                <p style="margin: 0 0 12px 0; display: flex; align-items: flex-start; gap: 12px;">
                  <span style="background-color: #d1d5db; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0;">2</span>
                  <span>You'll receive a shipping notification with tracking info</span>
                </p>
                <p style="margin: 0; display: flex; align-items: flex-start; gap: 12px;">
                  <span style="background-color: #d1d5db; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0;">3</span>
                  <span>Your sustainable fashion arrives at your doorstep!</span>
                </p>
              </div>
            </div>
            
            <!-- Environmental Impact -->
            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
              <p style="margin: 0; font-size: 24px; margin-bottom: 8px;">🌱</p>
              <p style="margin: 0; color: #065f46; font-weight: 500;">
                <strong>Thank you for choosing sustainable fashion!</strong><br>
                <span style="font-size: 14px; font-weight: normal;">Your purchase supports circular fashion and reduces textile waste.</span>
              </p>
            </div>
            
            <!-- Help Section -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
                Questions about your order?
              </p>
              <p style="margin: 0;">
                <a href="mailto:moses@moenviron.com" style="color: #059669; text-decoration: none; font-weight: 500;">moses@moenviron.com</a>
                <span style="color: #d1d5db; margin: 0 8px;">|</span>
                <a href="${siteUrl}/contact" style="color: #059669; text-decoration: none; font-weight: 500;">Contact Us</a>
              </p>
            </div>
            
          </div>
          
          <!-- Footer -->
          <div style="padding: 24px; text-align: center; background-color: #f3f4f6;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
              With love,<br>
              <strong style="color: #1f2937;">The Moenviron Team</strong>
            </p>
            <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
              Sustainable Fashion for a Better Tomorrow
            </p>
          </div>
          
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending order confirmation email:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
