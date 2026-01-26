import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAILERLITE_API_URL = "https://connect.mailerlite.com/api";
const GROUP_NAME = "Moenviron Newsletter";

interface SyncRequest {
  action: "test" | "sync";
}

async function mailerliteRequest(
  endpoint: string,
  apiKey: string,
  method: string = "GET",
  body?: unknown
): Promise<{ data?: unknown; error?: string }> {
  try {
    const response = await fetch(`${MAILERLITE_API_URL}${endpoint}`, {
      method,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("MailerLite API error:", data);
      return { error: data.message || `API error: ${response.status}` };
    }

    return { data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("MailerLite request error:", errorMessage);
    return { error: errorMessage };
  }
}

async function getOrCreateGroup(apiKey: string): Promise<{ id: string; name: string } | null> {
  const { data: groupsData, error: listError } = await mailerliteRequest("/groups?limit=100", apiKey);
  
  if (listError) {
    console.error("Failed to list groups:", listError);
    return null;
  }

  const groups = (groupsData as { data: Array<{ id: string; name: string }> })?.data || [];
  const existingGroup = groups.find((g) => g.name === GROUP_NAME);

  if (existingGroup) {
    return { id: existingGroup.id, name: existingGroup.name };
  }

  const { data: newGroupData, error: createError } = await mailerliteRequest(
    "/groups",
    apiKey,
    "POST",
    { name: GROUP_NAME }
  );

  if (createError) {
    console.error("Failed to create group:", createError);
    return null;
  }

  const newGroup = (newGroupData as { data: { id: string; name: string } })?.data;
  return newGroup ? { id: newGroup.id, name: newGroup.name } : null;
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
      .eq("section_key", "mailerlite")
      .single();

    if (settingsError || !settingsData?.content?.api_key) {
      return new Response(
        JSON.stringify({ success: false, error: "MailerLite API key not configured" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const apiKey = settingsData.content.api_key;
    const { action }: SyncRequest = await req.json();

    if (action === "test") {
      const group = await getOrCreateGroup(apiKey);
      
      if (!group) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid API key or connection failed" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Connection successful",
          group_id: group.id,
          group_name: group.name,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "sync") {
      const group = await getOrCreateGroup(apiKey);
      
      if (!group) {
        return new Response(
          JSON.stringify({ success: false, error: "Failed to get/create group" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

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
          JSON.stringify({ 
            success: true, 
            synced_count: 0, 
            message: "No active subscribers to sync",
            group_id: group.id,
            group_name: group.name,
          }),
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

          const { error: createError } = await mailerliteRequest(
            "/subscribers",
            apiKey,
            "POST",
            {
              email: subscriber.email,
              fields: {
                name: firstName,
                last_name: lastName,
              },
              groups: [group.id],
              status: "active",
            }
          );

          if (createError) {
            if (createError.includes("already exists") || createError.includes("Member Exists")) {
              syncedCount++;
            } else {
              errors.push(`Failed ${subscriber.email}: ${createError}`);
            }
          } else {
            syncedCount++;
          }

          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          errors.push(`Error syncing ${subscriber.email}: ${errorMessage}`);
        }
      }

      console.log(`Synced ${syncedCount}/${subscribers.length} subscribers. Errors: ${errors.length}`);
      if (errors.length > 0) {
        console.error("Sync errors:", errors.slice(0, 5));
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          synced_count: syncedCount, 
          total: subscribers.length,
          group_id: group.id,
          group_name: group.name,
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
    console.error("Error in sync-to-mailerlite:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
