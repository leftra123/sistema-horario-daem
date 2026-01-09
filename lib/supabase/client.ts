import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente de Supabase para componentes del cliente (use client)
 * Usa las variables de entorno de .env.local
 */
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

/**
 * Validador de dominio de email
 * Solo permite correos de @galvarinochile.cl o @edugalvarino.cl
 *
 * @param email - Email a validar
 * @returns true si el dominio está permitido, false en caso contrario
 *
 * @example
 * isEmailDomainAllowed('juan@galvarinochile.cl') // true
 * isEmailDomainAllowed('maria@edugalvarino.cl')  // true
 * isEmailDomainAllowed('hacker@gmail.com')        // false
 */
export function isEmailDomainAllowed(email: string): boolean {
  const allowedDomains = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS?.split(',') || [];
  const domain = email.split('@')[1]?.toLowerCase();

  if (!domain) return false;

  return allowedDomains.some(d => d.toLowerCase().trim() === domain);
}
