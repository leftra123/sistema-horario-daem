'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, User, Mail, Shield, Save } from 'lucide-react';
import Link from 'next/link';

export default function PerfilPage() {
  const { profile, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    rol: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Cargar datos del perfil cuando esté disponible
  useEffect(() => {
    if (profile) {
      setFormData({
        nombre_completo: profile.nombre_completo,
        email: profile.email,
        rol: profile.rol,
      });
    }
  }, [profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validar que el nombre no esté vacío
    if (!formData.nombre_completo.trim()) {
      setMessage({
        type: 'error',
        text: 'El nombre completo no puede estar vacío'
      });
      setLoading(false);
      return;
    }

    try {
      // ✅ Solo permitir actualizar nombre_completo (NO email ni rol)
      const { error } = await supabase
        .from('users')
        .update({
          nombre_completo: formData.nombre_completo.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile?.id);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: '¡Perfil actualizado correctamente!'
      });

      // Refrescar la página después de 1.5 segundos para que se actualice el perfil en useAuth
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('[Perfil] Error actualizando:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al actualizar el perfil. Por favor, intenta nuevamente.'
      });
    } finally {
      setLoading(false);
    }
  }

  // Mapeo de roles a etiquetas amigables
  const getRoleLabel = (rol: string) => {
    switch (rol) {
      case 'admin':
        return 'Administrador';
      case 'profesor':
        return 'Profesor';
      case 'visualizador':
        return 'Visualizador';
      default:
        return rol;
    }
  };

  const getRoleIcon = (rol: string) => {
    switch (rol) {
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'profesor':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'visualizador':
        return <User className="w-4 h-4 text-gray-600" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (rol: string) => {
    switch (rol) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'profesor':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'visualizador':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header con botón volver */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Inicio
            </Link>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              <User className="w-8 h-8" />
              Mi Perfil
            </h1>
            <p className="text-gray-600">
              Actualiza tu información personal
            </p>
          </div>

          {/* Información de solo lectura */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">ℹ️ Información de cuenta:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-700" />
                <span className="text-blue-800">
                  <strong>Email:</strong> {formData.email}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {getRoleIcon(formData.rol)}
                <span className="text-blue-800">
                  <strong>Rol:</strong> {getRoleLabel(formData.rol)}
                </span>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                ⚠️ El email y el rol no se pueden modificar. Si necesitas cambiarlos, contacta a un administrador.
              </p>
            </div>
          </div>

          {/* Formulario de edición */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre Completo (EDITABLE) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline w-4 h-4 mr-1" />
                  Nombre Completo *
                </label>
                <Input
                  type="text"
                  placeholder="Tu nombre completo"
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                  required
                  disabled={loading}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este nombre se mostrará en todo el sistema
                </p>
              </div>

              {/* Email (SOLO LECTURA) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline w-4 h-4 mr-1" />
                  Correo Electrónico
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  El email no se puede modificar
                </p>
              </div>

              {/* Rol (SOLO LECTURA) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Shield className="inline w-4 h-4 mr-1" />
                  Rol en el Sistema
                </label>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border ${getRoleBadgeColor(formData.rol)}`}>
                    {getRoleIcon(formData.rol)}
                    {getRoleLabel(formData.rol)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Solo un administrador puede cambiar tu rol
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </span>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/')}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </form>

            {/* Mensajes */}
            {message && (
              <div
                className={`mt-6 p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}
          </div>

          {/* Footer info */}
          <div className="mt-6 bg-gray-100 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              💡 <strong>Tip:</strong> Puedes actualizar tu nombre completo en cualquier momento. Los cambios se reflejarán inmediatamente en todo el sistema.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
