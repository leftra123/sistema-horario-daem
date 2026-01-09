'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  nombre_completo: string;
  rol: 'admin' | 'profesor' | 'visualizador';
  establecimiento_id: number | null;
}

/**
 * Hook de autenticación que proporciona información del usuario
 * y helpers de permisos para control de acceso basado en roles (RBAC)
 *
 * @returns Objeto con usuario, perfil, estado de carga y helpers de permisos
 *
 * @example
 * function MyComponent() {
 *   const { isAuthenticated, isAdmin, canEdit, profile, loading } = useAuth();
 *
 *   if (loading) return <Loading />;
 *   if (!isAuthenticated) return <LoginPrompt />;
 *
 *   return (
 *     <div>
 *       <p>Bienvenido, {profile?.nombre_completo}</p>
 *       {canEdit && <Button>Editar</Button>}
 *     </div>
 *   );
 * }
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ FIX: Memoizar cliente para evitar recreación en cada render
  const supabase = useMemo(() => createClient(), []);

  // ✅ FIX: Memoizar función fetchProfile para evitar dependencias inestables
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('[Auth] Error fetching profile:', fetchError);
        setError('No se pudo cargar el perfil del usuario');
        setLoading(false);
        return;
      }

      setProfile(data);
      setError(null);
    } catch (err) {
      console.error('[Auth] Unexpected error:', err);
      setError('Error inesperado al cargar el perfil');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // ✅ FIX: Escuchar cambios de autenticación con manejo de eventos específicos
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] State change:', event);

      // Manejar eventos específicos
      if (event === 'TOKEN_REFRESHED') {
        console.log('[Auth] Token refreshed successfully');
      } else if (event === 'SIGNED_OUT') {
        console.log('[Auth] User signed out');
        setProfile(null);
        setError(null);
        setUser(null);
        setLoading(false);
        return;
      } else if (event === 'USER_UPDATED') {
        console.log('[Auth] User profile updated');
      }

      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setError(null);
        setLoading(false);
      }
    });

    // ✅ FIX: Intervalo para refrescar sesión proactivamente (cada 50 minutos)
    // Los tokens de Supabase expiran en 1 hora, así que refrescamos antes
    const refreshInterval = setInterval(async () => {
      const { data: { session }, error: refreshError } = await supabase.auth.getSession();

      if (refreshError) {
        console.error('[Auth] Error checking session:', refreshError);
        return;
      }

      if (session) {
        // Calcular tiempo hasta expiración
        const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;

        // Si faltan menos de 10 minutos, refrescar
        if (timeUntilExpiry < 10 * 60 * 1000) {
          console.log('[Auth] Proactively refreshing session...');
          const { error: refreshTokenError } = await supabase.auth.refreshSession();

          if (refreshTokenError) {
            console.error('[Auth] Failed to refresh session:', refreshTokenError);
            // Si falla el refresh, el usuario será deslogueado automáticamente
            setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          } else {
            console.log('[Auth] Session refreshed proactively');
          }
        }
      }
    }, 50 * 60 * 1000); // Cada 50 minutos

    // ✅ FIX: Cleanup para evitar memory leaks
    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [supabase, fetchProfile]);

  // ✅ FIX: Memoizar permisos para evitar re-renders innecesarios
  const permissions = useMemo(() => {
    const isAdmin = profile?.rol === 'admin';
    const isProfesor = profile?.rol === 'profesor';
    const isVisualizador = profile?.rol === 'visualizador';

    return {
      isAdmin,
      isProfesor,
      isVisualizador,
      canEdit: isAdmin,
      canDelete: isAdmin,
      canManageUsers: isAdmin,
    };
  }, [profile?.rol]);

  return {
    user,
    profile,
    loading,
    error,
    isAuthenticated: !!user,
    ...permissions,
  };
}
