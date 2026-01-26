import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminActionRequest {
  action: "list" | "add" | "remove";
  email?: string;
  userId?: string;
  role?: string;
  responsibilities?: string;
  siteUrl?: string;
}

const getRoleDescription = (role: string) => {
  switch (role) {
    case "super_admin":
      return {
        title: "Super Administrator",
        color: "#dc2626",
        permissions: [
          "Full access to all admin features",
          "Manage other administrators",
          "Access to all reports and analytics",
          "System configuration and settings"
        ]
      };
    case "admin":
      return {
        title: "Administrator",
        color: "#059669",
        permissions: [
          "Manage products and inventory",
          "Process and update orders",
          "View reports and analytics",
          "Respond to customer inquiries"
        ]
      };
    case "editor":
      return {
        title: "Content Editor",
        color: "#7c3aed",
        permissions: [
          "Create and edit products",
          "Manage product descriptions and images",
          "Update website content"
        ]
      };
    case "moderator":
      return {
        title: "Moderator",
        color: "#2563eb",
        permissions: [
          "Review customer submissions",
          "Moderate reviews and comments",
          "Handle flagged content"
        ]
      };
    case "support":
      return {
        title: "Support Staff",
        color: "#0891b2",
        permissions: [
          "View order details",
          "Respond to customer inquiries",
          "Update order status",
          "Process returns and refunds"
        ]
      };
    default:
      return {
        title: role.charAt(0).toUpperCase() + role.slice(1),
        color: "#6b7280",
        permissions: ["Access based on assigned role"]
      };
  }
};

const sendAdminInvitationEmail = async (
  resend: Resend,
  email: string,
  role: string,
  responsibilities: string | null,
  inviterName: string,
  confirmationUrl: string,
  siteUrl: string
) => {
  const roleInfo = getRoleDescription(role);
  
  const permissionsHtml = roleInfo.permissions.map(perm => `
    <tr>
      <td style="padding: 8px 0; vertical-align: top; width: 24px;">
        <span style="color: ${roleInfo.color};">✓</span>
      </td>
      <td style="padding: 8px 0 8px 8px; color: #4b5563; font-size: 14px;">
        ${perm}
      </td>
    </tr>
  `).join("");

  const responsibilitiesHtml = responsibilities ? `
    <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #92400e;">
        📋 Your Assigned Responsibilities
      </h3>
      <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
        ${responsibilities}
      </p>
    </div>
  ` : '';

  return resend.emails.send({
    from: "Moenviron <admin@moenviron.com>",
    to: [email],
    subject: `You've Been Invited as ${roleInfo.title} on Moenviron`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9fafb;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); padding: 40px 24px; text-align: center;">
          <div style="display: inline-block; background-color: rgba(255,255,255,0.1); border-radius: 50%; padding: 16px; margin-bottom: 16px;">
            <span style="font-size: 32px;">🔐</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 700;">You're Invited to Join the Team!</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 16px;">Moenviron Admin Dashboard</p>
        </div>
        
        <!-- Content -->
        <div style="background-color: white; padding: 32px 24px;">
          
          <!-- Greeting -->
          <p style="font-size: 16px; margin: 0 0 24px 0; color: #4b5563;">
            <strong>${inviterName}</strong> has granted you administrative access to the Moenviron platform.
          </p>
          
          <!-- Role Badge -->
          <div style="background: linear-gradient(135deg, ${roleInfo.color}15 0%, ${roleInfo.color}10 100%); border: 1px solid ${roleInfo.color}30; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Your Role</p>
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${roleInfo.color};">
              ${roleInfo.title}
            </p>
          </div>
          
          ${responsibilitiesHtml}
          
          <!-- Accept Button -->
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(135deg, ${roleInfo.color} 0%, ${roleInfo.color}dd 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px ${roleInfo.color}40;">
              ✨ Accept Invitation & Set Up Account
            </a>
          </div>
          
          <!-- Permissions -->
          <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">
              🎯 What You Can Do
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${permissionsHtml}
            </table>
          </div>
          
          <!-- Admin Dashboard Info -->
          <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 14px; color: #0369a1;">
              <strong>📍 Admin Dashboard:</strong><br>
              Once your account is set up, access the admin dashboard at:<br>
              <a href="${siteUrl}/admin" style="color: #0284c7; font-weight: 500;">${siteUrl}/admin</a>
            </p>
          </div>
          
          <!-- Security Note -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center;">
              🔒 This invitation was sent to <strong>${email}</strong>.<br>
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
          
        </div>
        
        <!-- Footer -->
        <div style="padding: 24px; text-align: center; background-color: #f3f4f6;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
            Welcome to the team!<br>
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
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin"])
      .single();

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: "Unauthorized: Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { action, email, userId, role, responsibilities, siteUrl = "https://moenviron.com" }: AdminActionRequest = await req.json();

    if (action === "list") {
      const { data: roles, error: rolesErr } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role, responsibilities, created_at")
        .neq("role", "user");

      if (rolesErr) throw rolesErr;

      const { data: { users }, error: usersErr } = await supabaseAdmin.auth.admin.listUsers();
      if (usersErr) throw usersErr;

      const admins = roles.map(roleRow => {
        const authUser = users.find(u => u.id === roleRow.user_id);
        return {
          id: roleRow.user_id,
          email: authUser?.email || "Unknown",
          role: roleRow.role,
          responsibilities: roleRow.responsibilities,
          created_at: roleRow.created_at,
          last_sign_in_at: authUser?.last_sign_in_at || null,
          confirmed: !!authUser?.email_confirmed_at
        };
      });

      return new Response(JSON.stringify({ admins }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (action === "add") {
      if (!email) throw new Error("Email is required");
      const assignRole = role || "admin";

      const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
      if (listErr) throw listErr;

      let targetUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      let wasInvited = false;

      if (!targetUser) {
        const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${siteUrl}/admin-login`,
        });
        if (inviteErr) throw inviteErr;
        targetUser = inviteData.user;
        wasInvited = true;

        const inviterEmail = user.email || "Admin";
        const confirmationUrl = `${siteUrl}/admin-login`;
        
        try {
          await sendAdminInvitationEmail(
            resend,
            email,
            assignRole,
            responsibilities || null,
            inviterEmail,
            confirmationUrl,
            siteUrl
          );
          console.log("Custom admin invitation email sent to:", email);
        } catch (emailErr) {
          console.error("Failed to send custom email, but user was still invited:", emailErr);
        }
      }

      const { error: assignErr } = await supabaseAdmin
        .from("user_roles")
        .upsert({ 
          user_id: targetUser.id, 
          role: assignRole,
          responsibilities: responsibilities || null 
        }, { onConflict: "user_id,role" });

      if (assignErr) throw assignErr;

      return new Response(JSON.stringify({ 
        success: true, 
        user: { id: targetUser.id, email: targetUser.email }, 
        invited: wasInvited
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (action === "remove") {
      if (!userId || !role) throw new Error("User ID and role are required");
      
      if (userId === user.id && role === "super_admin") {
        return new Response(JSON.stringify({ error: "Cannot remove your own super_admin role" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { error: removeErr } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (removeErr) throw removeErr;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
