import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import * as OTPAuth from "https://esm.sh/otpauth@9.3.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TOTPRequest {
  action: "generate" | "verify" | "enable" | "disable";
  code?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Unauthorized");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user session
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body: TOTPRequest = await req.json();

    if (body.action === "generate") {
      // Generate new TOTP secret
      const secret = new OTPAuth.Secret({ size: 20 });
      const totp = new OTPAuth.TOTP({
        issuer: "AgriCapital",
        label: user.email || "utilisateur",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: secret,
      });

      // Store secret temporarily (not enabled yet)
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          totp_secret_pending: secret.base32,
        },
      });

      if (updateError) throw new Error(`Failed to store secret: ${updateError.message}`);

      // Return QR code URI and secret
      return new Response(
        JSON.stringify({
          success: true,
          uri: totp.toString(),
          secret: secret.base32,
          recovery_codes: generateRecoveryCodes(),
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (body.action === "verify") {
      if (!body.code) {
        throw new Error("Code is required");
      }

      // Get pending or active secret
      const secretBase32 = user.user_metadata?.totp_secret || user.user_metadata?.totp_secret_pending;
      if (!secretBase32) {
        throw new Error("No TOTP configured");
      }

      const totp = new OTPAuth.TOTP({
        issuer: "AgriCapital",
        label: user.email || "utilisateur",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secretBase32),
      });

      const delta = totp.validate({ token: body.code, window: 1 });
      const isValid = delta !== null;

      return new Response(
        JSON.stringify({ success: true, valid: isValid }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (body.action === "enable") {
      if (!body.code) {
        throw new Error("Verification code is required");
      }

      const pendingSecret = user.user_metadata?.totp_secret_pending;
      if (!pendingSecret) {
        throw new Error("No pending TOTP setup");
      }

      // Verify the code first
      const totp = new OTPAuth.TOTP({
        issuer: "AgriCapital",
        label: user.email || "utilisateur",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(pendingSecret),
      });

      const delta = totp.validate({ token: body.code, window: 1 });
      if (delta === null) {
        throw new Error("Invalid verification code");
      }

      // Move secret from pending to active
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          totp_secret: pendingSecret,
          totp_secret_pending: null,
          totp_enabled: true,
          totp_enabled_at: new Date().toISOString(),
        },
      });

      if (updateError) throw new Error(`Failed to enable TOTP: ${updateError.message}`);

      return new Response(
        JSON.stringify({ success: true, message: "2FA enabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (body.action === "disable") {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          totp_secret: null,
          totp_secret_pending: null,
          totp_enabled: false,
          totp_disabled_at: new Date().toISOString(),
        },
      });

      if (updateError) throw new Error(`Failed to disable TOTP: ${updateError.message}`);

      return new Response(
        JSON.stringify({ success: true, message: "2FA disabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    throw new Error(`Unknown action: ${body.action}`);
  } catch (error: any) {
    console.error("TOTP error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.message === "Unauthorized" ? 401 : 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

function generateRecoveryCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase() + "-" +
                 Math.random().toString(36).substring(2, 6).toUpperCase();
    codes.push(code);
  }
  return codes;
}
