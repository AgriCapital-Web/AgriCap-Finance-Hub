import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CreateUserRequest {
  action: "create" | "update_role" | "toggle_status";
  email?: string;
  password?: string;
  full_name?: string;
  phone?: string;
  title?: string;
  role?: string;
  user_id?: string;
  is_active?: boolean;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Unauthorized: No authorization header");
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client for verifying the caller
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify caller's session
    const { data: { user: caller }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !caller) {
      throw new Error("Unauthorized: Invalid session");
    }

    // Admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if caller is super_admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (roleError || roleData?.role !== "super_admin") {
      throw new Error("Forbidden: Only super_admin can manage users");
    }

    const body: CreateUserRequest = await req.json();

    if (body.action === "create") {
      // Validate required fields
      if (!body.email || !body.password || !body.full_name || !body.role) {
        throw new Error("Missing required fields: email, password, full_name, role");
      }

      // Create user with Admin API
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: {
          full_name: body.full_name,
          phone: body.phone || "",
          title: body.title || "",
        },
      });

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      // Assign role
      const { error: roleInsertError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: newUser.user.id,
          role: body.role,
        });

      if (roleInsertError) {
        // Cleanup: delete the user if role assignment fails
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        throw new Error(`Failed to assign role: ${roleInsertError.message}`);
      }

      return new Response(
        JSON.stringify({ success: true, user_id: newUser.user.id }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (body.action === "update_role") {
      if (!body.user_id || !body.role) {
        throw new Error("Missing required fields: user_id, role");
      }

      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: body.user_id, role: body.role }, { onConflict: "user_id" });

      if (error) throw new Error(`Failed to update role: ${error.message}`);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (body.action === "toggle_status") {
      if (!body.user_id || body.is_active === undefined) {
        throw new Error("Missing required fields: user_id, is_active");
      }

      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ is_active: body.is_active })
        .eq("id", body.user_id);

      if (error) throw new Error(`Failed to toggle status: ${error.message}`);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    throw new Error(`Unknown action: ${body.action}`);
  } catch (error: any) {
    console.error("Error in admin-manage-users:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.message.includes("Unauthorized") ? 401 : error.message.includes("Forbidden") ? 403 : 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
