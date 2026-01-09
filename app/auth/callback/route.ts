import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

/**
 * Callback handler para verificación de OTP
 * Maneja la verificación automática cuando el usuario hace click en el magic link
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/';

  // ✅ FIX: Validar parámetros requeridos
  if (!token_hash || !type) {
    console.error('[Auth Callback] Missing required parameters');
    return NextResponse.redirect(new URL('/login?error=missing_params', request.url));
  }

  // ✅ FIX: Validar que el tipo sea válido antes de usarlo
  const validTypes: EmailOtpType[] = ['email', 'signup', 'invite', 'magiclink', 'recovery', 'email_change'];

  if (!validTypes.includes(type as EmailOtpType)) {
    console.error('[Auth Callback] Invalid OTP type:', type);
    return NextResponse.redirect(new URL('/login?error=invalid_type', request.url));
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType, // ✅ Ahora type-safe
      token_hash,
    });

    if (error) {
      console.error('[Auth Callback] Verification failed:', error);
      return NextResponse.redirect(new URL('/login?error=verification_failed', request.url));
    }

    // ✅ Redirigir a la página solicitada o home después de autenticación exitosa
    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error);
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}
