import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Cliente de Supabase para componentes del servidor y route handlers
 * Maneja automáticamente las cookies de autenticación
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // ✅ FIX: Agregar logging para debugging
            // El método `setAll` fue llamado desde un Server Component.
            // Esto puede ser ignorado si tienes middleware refrescando las sesiones del usuario.
            console.warn('[Supabase Server] Failed to set cookies (expected in Server Components):', error);

            // En producción, podrías enviar esto a un servicio de logging:
            // if (process.env.NODE_ENV === 'production') {
            //   logger.warn('Supabase cookie setting failed', { error, context: 'server-component' });
            // }
          }
        },
      },
    }
  );
}
