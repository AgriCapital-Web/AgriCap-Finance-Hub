import { supabase } from '@/integrations/supabase/client';

interface TOTPGenerateResponse {
  success: boolean;
  uri: string;
  secret: string;
  recovery_codes: string[];
}

interface TOTPVerifyResponse {
  success: boolean;
  valid: boolean;
}

interface TOTPActionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function generateTOTP(): Promise<TOTPGenerateResponse> {
  const response = await supabase.functions.invoke('totp-auth', {
    body: { action: 'generate' },
  });

  if (response.error) {
    throw new Error(response.error.message || 'Erreur lors de la génération');
  }

  if (response.data?.error) {
    throw new Error(response.data.error);
  }

  return response.data;
}

export async function verifyTOTP(code: string): Promise<boolean> {
  const response = await supabase.functions.invoke('totp-auth', {
    body: { action: 'verify', code },
  });

  if (response.error) {
    throw new Error(response.error.message || 'Erreur de vérification');
  }

  if (response.data?.error) {
    throw new Error(response.data.error);
  }

  return response.data.valid;
}

export async function enableTOTP(code: string): Promise<TOTPActionResponse> {
  const response = await supabase.functions.invoke('totp-auth', {
    body: { action: 'enable', code },
  });

  if (response.error) {
    throw new Error(response.error.message || 'Erreur lors de l\'activation');
  }

  if (response.data?.error) {
    throw new Error(response.data.error);
  }

  return response.data;
}

export async function disableTOTP(): Promise<TOTPActionResponse> {
  const response = await supabase.functions.invoke('totp-auth', {
    body: { action: 'disable' },
  });

  if (response.error) {
    throw new Error(response.error.message || 'Erreur lors de la désactivation');
  }

  if (response.data?.error) {
    throw new Error(response.data.error);
  }

  return response.data;
}
