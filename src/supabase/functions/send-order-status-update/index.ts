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

interface OrderStatusRequest {
  orderId: string;
  userEmail: string;
  userName: string;
  newStatus: string;
  totalAmount: number;
  currency: string;
}

const getStatusMessage = (status: string, orderId: string): { subject: string; heading: string; message: string } => {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return {
        subject: "Order Confirmed",
        heading: "Your Order is Confirmed! ✅",
        message: "Great news! Your order has been confirmed and is being prepared for shipment."
      };
      case 'shipped':
        return {
          subject: "Order Shipped",
          heading: "Your Order is On Its Way! 🚚",
          message: `Exciting news! Your order has been shipped and is on its way to you. 
          
          <div style="margin: 25px 0; text-align: center;">
            <a href="https://moenviron.com/track?id=${orderId}" style="background-color: #2d5a27; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Track Your Package
            </a>
          </div>
          
          You should receive it within 3-5 business days.`
        };
    case 'delivered':
      return {
        subject: "Order Delivered",
        heading: "Your Order Has Been Delivered! 📦",
        message: "Your order has been delivered! We hope you love your sustainable fashion items. Thank you for choosing Moenviron and supporting sustainable fashion."
      };
    case 'cancelled':
      return {
        subject: "Order Cancelled",
        heading: "Order Cancelled",
        message: "Your order has been cancelled. If you have any questions, please contact our support team."
      };
    default:
      return {
        subject: "Order Status Update",
        heading: "Order Status Updated",
        message: `Your order status has been updated to: ${status}`
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Order status update function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = await getResendApiKey();
    if (!apiKey) {
      throw new Error("Resend API key not configured");
    }
    const resend = new Resend(apiKey);

    const { orderId, userEmail, userName, newStatus, totalAmount, currency }: OrderStatusRequest = await req.json();
    
    console.log(`Sending status update email for order ${orderId} to ${userEmail}, new status: ${newStatus}`);

    const statusInfo = getStatusMessage(newStatus, orderId);
    const currencySymbol = currency === 'KES' ? 'KES ' : '£';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${statusInfo.subject} - Moenviron</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8faf8;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2d5a27 0%, #4a7c43 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🌿 Moenviron</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Sustainable Fashion</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #2d5a27; margin: 0 0 20px 0; font-size: 24px;">${statusInfo.heading}</h2>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Hi ${userName || 'Valued Customer'},
            </p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              ${statusInfo.message}
            </p>
            
            <!-- Order Details -->
            <div style="background-color: #f8faf8; border-radius: 12px; padding: 25px; margin: 30px 0;">
              <h3 style="color: #2d5a27; margin: 0 0 15px 0; font-size: 18px;">Order Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Order Number:</td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-family: monospace;">${orderId.slice(0, 8)}...</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Status:</td>
                  <td style="padding: 8px 0; color: #2d5a27; font-size: 14px; text-align: right; font-weight: 600; text-transform: capitalize;">${newStatus}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Total:</td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 600;">${currencySymbol}${totalAmount.toFixed(2)}</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                If you have any questions about your order, please don't hesitate to contact us at 
                <a href="mailto:moses@moenviron.com" style="color: #2d5a27;">moses@moenviron.com</a>
              </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8faf8; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              Thank you for supporting sustainable fashion! 🌍
            </p>
            <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
              © ${new Date().getFullYear()} Moenviron. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Moenviron <orders@moenviron.com>",
      to: [userEmail],
      subject: `${statusInfo.subject} - Order #${orderId.slice(0, 8)}`,
      html: emailHtml,
    });

    console.log("Status update email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
} catch (error: unknown) {
      console.error("Error in send-order-status-update function:", error);
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
