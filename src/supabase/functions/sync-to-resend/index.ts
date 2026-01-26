import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncRequest {
  action: "test" | "sync" | "send_test";
  email?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: settingsData, error: settingsError } = await supabase
      .from("site_content")
      .select("content")
      .eq("section_key", "resend")
      .single();

    if (settingsError || !settingsData?.content?.api_key) {
      return new Response(
        JSON.stringify({ success: false, error: "Resend API key not configured" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resendApiKey = settingsData.content.api_key;
    const fromEmail = settingsData.content.from_email || "noreply@moenv.org";
    const fromName = settingsData.content.from_name || "Moenv";
    const resend = new Resend(resendApiKey);

    const { action, email }: SyncRequest = await req.json();

    if (action === "send_test" && email) {
      try {
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: [email],
          subject: "Test Email from Moenviron",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9fafb;">
              <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 40px 24px; text-align: center;">
                <div style="display: inline-block; background-color: rgba(255,255,255,0.2); border-radius: 50%; padding: 16px; margin-bottom: 16px;">
                  <span style="font-size: 32px;">🌿</span>
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Resend Integration Test</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Your email integration is working!</p>
              </div>
              
              <div style="background-color: white; padding: 32px 24px;">
                <p style="font-size: 18px; margin: 0 0 24px 0;">
                  Hi there! 👋
                </p>
                <p style="margin: 0 0 24px 0; color: #4b5563;">
                  This is a test email from <strong>Moenviron</strong>. If you're receiving this, your Resend integration is configured correctly!
                </p>
                
                <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
                  <p style="margin: 0; font-size: 24px; margin-bottom: 8px;">✅</p>
                  <p style="margin: 0; color: #065f46; font-weight: 500;">
                    <strong>Email Delivery Successful!</strong><br>
                    <span style="font-size: 14px; font-weight: normal;">Your newsletters and order confirmations will be delivered smoothly.</span>
                  </p>
                </div>
                
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  Sent at: ${new Date().toLocaleString()}
                </p>
              </div>
              
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
        
        if (emailError) {
          console.error("Resend send error:", emailError);
          return new Response(
            JSON.stringify({ success: false, error: emailError.message || "Failed to send email" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        console.log("Test email sent successfully:", emailData);
        return new Response(
          JSON.stringify({ success: true, message: "Test email sent", id: emailData?.id }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } catch (error: unknown) {
        console.error("Send test email error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to send test email";
        return new Response(
          JSON.stringify({ success: false, error: errorMessage }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    if (action === "test") {
      try {
        const { data: contacts, error: contactsError } = await resend.contacts.list();
        
        if (contactsError) {
          console.error("Resend API error:", contactsError);
          return new Response(
            JSON.stringify({ success: false, error: "Invalid API key or connection failed" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: "Connection successful", contacts_count: contacts?.data?.length || 0 }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } catch (error: unknown) {
        console.error("Test connection error:", error);
        const errorMessage = error instanceof Error ? error.message : "Connection test failed";
        return new Response(
          JSON.stringify({ success: false, error: errorMessage }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    if (action === "sync") {
      const { data: subscribers, error: subscribersError } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .eq("is_active", true);

      if (subscribersError) {
        console.error("Error fetching subscribers:", subscribersError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to fetch subscribers" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!subscribers || subscribers.length === 0) {
        return new Response(
          JSON.stringify({ success: true, synced_count: 0, message: "No active subscribers to sync" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      let syncedCount = 0;
      const errors: string[] = [];

      for (const subscriber of subscribers) {
        try {
          const nameParts = subscriber.name?.split(" ") || [];
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "";

          const { error: createError } = await resend.contacts.create({
            email: subscriber.email,
            firstName: firstName,
            lastName: lastName,
            unsubscribed: false,
          });

          if (createError) {
            if (createError.message?.includes("already exists")) {
              const { error: updateError } = await resend.contacts.update({
                email: subscriber.email,
                firstName: firstName,
                lastName: lastName,
                unsubscribed: false,
              });

              if (!updateError) {
                syncedCount++;
              } else {
                errors.push(`Failed to update ${subscriber.email}: ${updateError.message}`);
              }
            } else {
              errors.push(`Failed to create ${subscriber.email}: ${createError.message}`);
            }
          } else {
            syncedCount++;
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          errors.push(`Error syncing ${subscriber.email}: ${errorMessage}`);
        }
      }

      console.log(`Synced ${syncedCount}/${subscribers.length} subscribers. Errors: ${errors.length}`);
      if (errors.length > 0) {
        console.error("Sync errors:", errors);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          synced_count: syncedCount, 
          total: subscribers.length,
          errors: errors.length > 0 ? errors.slice(0, 5) : undefined
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Error in sync-to-resend:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
