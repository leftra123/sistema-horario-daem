'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient, isEmailDomainAllowed } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ✅ FIX: Mapeo de errores para mensajes amigables
const ERROR_MESSAGES: Record<string, string> = {
  verification_failed: 'El enlace de verificación expiró o es inválido. Por favor, solicita un nuevo código.',
  missing_params: 'Enlace de verificación incorrecto. Por favor, solicita un nuevo código.',
  invalid_type: 'Tipo de verificación inválido. Por favor, solicita un nuevo código.',
  server_error: 'Error del servidor. Por favor, intenta nuevamente.',
};

const RESEND_COOLDOWN = 60; // 60 segundos entre reenvíos
const MAX_LOGIN_ATTEMPTS = 5; // Máximo de intentos antes de bloqueo
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos en ms

// ✅ FIX: Rate limiting - Estructura para trackear intentos
interface LoginAttempt {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

// ✅ FIX: Helpers para rate limiting
function getLoginAttempts(email: string): LoginAttempt {
  const stored = localStorage.getItem(`login_attempts_${email}`);
  if (!stored) {
    return { count: 0, firstAttempt: Date.now() };
  }
  return JSON.parse(stored);
}

function setLoginAttempts(email: string, attempts: LoginAttempt) {
  localStorage.setItem(`login_attempts_${email}`, JSON.stringify(attempts));
}

function checkRateLimit(email: string): { allowed: boolean; remainingTime?: number } {
  const attempts = getLoginAttempts(email);
  const now = Date.now();

  // Si está bloqueado, verificar si ya expiró el bloqueo
  if (attempts.blockedUntil && attempts.blockedUntil > now) {
    return {
      allowed: false,
      remainingTime: Math.ceil((attempts.blockedUntil - now) / 1000),
    };
  }

  // Si la ventana de tiempo expiró, resetear contador
  if (now - attempts.firstAttempt > RATE_LIMIT_WINDOW) {
    setLoginAttempts(email, { count: 0, firstAttempt: now });
    return { allowed: true };
  }

  // Si excedió el límite, bloquear por 15 minutos
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const blockedUntil = now + RATE_LIMIT_WINDOW;
    setLoginAttempts(email, { ...attempts, blockedUntil });
    return {
      allowed: false,
      remainingTime: Math.ceil(RATE_LIMIT_WINDOW / 1000),
    };
  }

  return { allowed: true };
}

function incrementLoginAttempts(email: string) {
  const attempts = getLoginAttempts(email);
  setLoginAttempts(email, {
    ...attempts,
    count: attempts.count + 1,
  });
}

// ✅ FIX: Componente separado para manejar searchParams (requiere Suspense)
function ErrorHandler({ setMessage }: { setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam && ERROR_MESSAGES[errorParam]) {
      setMessage({ type: 'error', text: ERROR_MESSAGES[errorParam] });
    }
  }, [searchParams, setMessage]);

  return null;
}

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  // ✅ FIX: Countdown para reenvío de código
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validar dominio de email
    if (!isEmailDomainAllowed(email)) {
      setMessage({
        type: 'error',
        text: 'Solo se permiten correos @galvarinochile.cl o @edugalvarino.cl'
      });
      setLoading(false);
      return;
    }

    // ✅ FIX: Verificar rate limiting antes de enviar OTP
    const rateLimitCheck = checkRateLimit(email);
    if (!rateLimitCheck.allowed) {
      const minutes = Math.floor(rateLimitCheck.remainingTime! / 60);
      const seconds = rateLimitCheck.remainingTime! % 60;
      setMessage({
        type: 'error',
        text: `Demasiados intentos. Por favor, espera ${minutes}m ${seconds}s antes de intentar nuevamente.`
      });
      setLoading(false);
      return;
    }

    // Enviar Magic Link OTP
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // Solo permite login, no registro público
      },
    });

    if (error) {
      // ✅ FIX: Incrementar contador de intentos fallidos
      incrementLoginAttempts(email);
      setMessage({ type: 'error', text: error.message });
    } else {
      // ✅ FIX: Limpiar intentos previos en caso de éxito
      setLoginAttempts(email, { count: 0, firstAttempt: Date.now() });
      setMessage({
        type: 'success',
        text: `Código de verificación enviado a ${email}. Revisa tu bandeja de entrada.`
      });
      setOtpSent(true);
      setResendCountdown(RESEND_COOLDOWN); // ✅ Iniciar countdown
    }

    setLoading(false);
  }

  // ✅ FIX: Función para reenviar código OTP
  async function handleResendOTP() {
    if (resendCountdown > 0) return; // Prevenir spam

    setLoading(true);
    setMessage(null);

    // ✅ FIX: Verificar rate limiting también en reenvío
    const rateLimitCheck = checkRateLimit(email);
    if (!rateLimitCheck.allowed) {
      const minutes = Math.floor(rateLimitCheck.remainingTime! / 60);
      const seconds = rateLimitCheck.remainingTime! % 60;
      setMessage({
        type: 'error',
        text: `Demasiados intentos. Por favor, espera ${minutes}m ${seconds}s antes de intentar nuevamente.`
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      // ✅ FIX: Incrementar contador en caso de error
      incrementLoginAttempts(email);
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({
        type: 'success',
        text: `Nuevo código enviado a ${email}.`
      });
      setResendCountdown(RESEND_COOLDOWN); // Reiniciar countdown
    }

    setLoading(false);
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    if (error) {
      setMessage({ type: 'error', text: 'Código incorrecto o expirado' });
      setLoading(false);
    } else {
      setMessage({ type: 'success', text: 'Autenticación exitosa. Redirigiendo...' });
      setTimeout(() => router.push('/'), 1000);
    }
  }

  return (
    <>
      {/* ✅ FIX: ErrorHandler envuelto en Suspense */}
      <Suspense fallback={null}>
        <ErrorHandler setMessage={setMessage} />
      </Suspense>

      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏫</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Sistema de Horarios
          </h1>
          <p className="text-gray-600">
            DAEM Galvarino
          </p>
        </div>

        {/* Formulario de Email */}
        {!otpSent ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <Input
                type="email"
                placeholder="tu-email@galvarinochile.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Solo dominios @galvarinochile.cl o @edugalvarino.cl
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </span>
              ) : (
                'Enviar Código de Verificación'
              )}
            </Button>
          </form>
        ) : (
          /* Formulario de OTP */
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Verificación
              </label>
              <Input
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                maxLength={6}
                className="w-full text-center text-2xl tracking-widest font-mono"
                disabled={loading}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Ingresa el código de 6 dígitos enviado a <strong>{email}</strong>
              </p>
            </div>

            <Button type="submit" disabled={loading || otp.length !== 6} className="w-full">
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando...
                </span>
              ) : (
                'Verificar Código'
              )}
            </Button>

            {/* ✅ FIX: Botón para reenviar código */}
            <Button
              type="button"
              variant="outline"
              onClick={handleResendOTP}
              disabled={loading || resendCountdown > 0}
              className="w-full"
            >
              {resendCountdown > 0
                ? `Reenviar código en ${resendCountdown}s`
                : 'Reenviar código'
              }
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOtpSent(false);
                setOtp('');
                setMessage(null);
                setResendCountdown(0);
              }}
              className="w-full"
              disabled={loading}
            >
              Usar otro email
            </Button>
          </form>
        )}

        {/* Mensajes */}
        {message && (
          <div
            className={`mt-4 p-3 rounded text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Sistema seguro con autenticación por código OTP
          </p>
        </div>
      </div>
    </div>
    </>
  );
}

// ✅ FIX: Export default con Suspense boundary
export default function LoginPage() {
  return <LoginPageContent />;
}
