'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface Props {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'profesor' | 'visualizador';
  fallback?: React.ReactNode;
}

/**
 * Componente de Higher-Order para proteger rutas según autenticación y rol
 *
 * @param children - Contenido a renderizar si el usuario tiene acceso
 * @param requiredRole - Rol mínimo requerido (admins siempre tienen acceso)
 * @param fallback - Componente a mostrar si el usuario no tiene permisos
 *
 * @example
 * // Proteger una página solo para admins
 * <ProtectedRoute requiredRole="admin">
 *   <AdminPanel />
 * </ProtectedRoute>
 *
 * @example
 * // Proteger una página para cualquier usuario autenticado
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({ children, requiredRole, fallback }: Props) {
  const { isAuthenticated, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no mostrar nada (ya redirigió)
  if (!isAuthenticated) {
    return null;
  }

  // Si requiere un rol específico y no lo tiene (y no es admin), mostrar fallback
  if (requiredRole && profile?.rol !== requiredRole && profile?.rol !== 'admin') {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">
            No tienes permisos para acceder a esta página.
          </p>
          <p className="text-sm text-gray-500">
            Tu rol actual: <span className="font-semibold capitalize">{profile?.rol}</span>
          </p>
          <p className="text-sm text-gray-500">
            Rol requerido: <span className="font-semibold capitalize">{requiredRole}</span>
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
