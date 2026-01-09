'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { createClient, isEmailDomainAllowed } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, UserPlus, Mail, User, Shield } from 'lucide-react';
import Link from 'next/link';

export default function CrearUsuarioPage() {
  const [formData, setFormData] = useState({
    email: '',
    nombre_completo: '',
    rol: 'visualizador' as 'admin' | 'profesor' | 'visualizador',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validar dominio de email
    if (!isEmailDomainAllowed(formData.email)) {
      setMessage({
        type: 'error',
        text: 'Solo se permiten correos @galvarinochile.cl o @edugalvarino.cl'
      });
      setLoading(false);
      return;
    }

    try {
      // ✅ Crear usuario en Supabase Auth con OTP
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          data: {
            nombre_completo: formData.nombre_completo,
            rol: formData.rol,
          },
        },
      });

      if (authError) throw authError;

      // ✅ Mostrar mensaje de éxito
      setMessage({
        type: 'success',
        text: `¡Usuario creado! Se ha enviado un código de verificación a ${formData.email}. El usuario debe verificar su email para activar la cuenta.`
      });

      // Limpiar formulario
      setFormData({
        email: '',
        nombre_completo: '',
        rol: 'visualizador',
      });

      // Redirigir a la lista de usuarios después de 3 segundos
      setTimeout(() => {
        router.push('/admin/usuarios');
      }, 3000);

    } catch (error) {
      console.error('[Crear Usuario] Error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al crear el usuario. Por favor, intenta nuevamente.'
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header con botón volver */}
          <div className="mb-8">
            <Link
              href="/admin/usuarios"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Usuarios
            </Link>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              <UserPlus className="w-8 h-8" />
              Crear Nuevo Usuario
            </h1>
            <p className="text-gray-600">
              Invita a un nuevo usuario al sistema. Se le enviará un código de verificación por email.
            </p>
          </div>

          {/* Información importante */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información importante:</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>El usuario recibirá un código de verificación por email</li>
              <li>Debe verificar su email para activar la cuenta</li>
              <li>Solo se permiten dominios @galvarinochile.cl y @edugalvarino.cl</li>
              <li>Puedes cambiar el rol del usuario después desde la lista de usuarios</li>
            </ul>
          </div>

          {/* Formulario */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline w-4 h-4 mr-1" />
                  Correo Electrónico *
                </label>
                <Input
                  type="email"
                  placeholder="usuario@galvarinochile.cl"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                  className="w-full"
                />
              </div>

              {/* Nombre Completo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline w-4 h-4 mr-1" />
                  Nombre Completo *
                </label>
                <Input
                  type="text"
                  placeholder="Juan Pérez González"
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                  required
                  disabled={loading}
                  className="w-full"
                />
              </div>

              {/* Rol */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Shield className="inline w-4 h-4 mr-1" />
                  Rol *
                </label>
                <select
                  value={formData.rol}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'admin' || val === 'profesor' || val === 'visualizador') {
                        setFormData({ ...formData, rol: val });
                    }
                  }}
                  disabled={loading}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="visualizador">Visualizador (solo lectura)</option>
                  <option value="profesor">Profesor (ver su horario)</option>
                  <option value="admin">Admin (acceso total)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.rol === 'admin' && '⚠️ El usuario tendrá acceso total al sistema'}
                  {formData.rol === 'profesor' && 'El usuario solo podrá ver su propio horario'}
                  {formData.rol === 'visualizador' && 'El usuario solo podrá ver datos (sin editar)'}
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
                      Creando usuario...
                    </span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Crear Usuario
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/usuarios')}
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
        </div>
      </div>
    </ProtectedRoute>
  );
}
