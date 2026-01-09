'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { createClient } from '@/lib/supabase/client';
import { UserCog, Mail, User, Shield } from 'lucide-react';

interface Usuario {
  id: string;
  email: string;
  nombre_completo: string;
  rol: 'admin' | 'profesor' | 'visualizador';
  establecimiento_id: number | null;
  created_at: string;
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  // Memoize supabase client to avoid recreation on every render
  const supabase = useMemo(() => createClient(), []);

  const loadUsers = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading users:', error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // Initial load: loading is already true, so we can skip setting it to true
    // to avoid "calling setState synchronously within an effect" warning
    // eslint-disable-next-line
    loadUsers(false);
  }, [loadUsers]);

  async function updateUserRole(userId: string, newRole: 'admin' | 'profesor' | 'visualizador') {
    setUpdating(userId);
    const { error } = await supabase
      .from('users')
      .update({ rol: newRole })
      .eq('id', userId);

    if (error) {
      console.error('Error updating role:', error);
      alert('Error al actualizar el rol');
    } else {
      await loadUsers(true);
    }
    setUpdating(null);
  }

  function getRoleBadgeColor(rol: string) {
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
  }

  function getRoleIcon(rol: string) {
    switch (rol) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'profesor':
        return <User className="w-4 h-4" />;
      case 'visualizador':
        return <UserCog className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Gestión de Usuarios
              </h1>
              <p className="text-gray-600">
                Administra los roles y permisos de los usuarios del sistema
              </p>
            </div>
            {/* ✅ Botón para crear nuevo usuario */}
            <Link
              href="/admin/crear-usuario"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              <UserCog className="w-4 h-4" />
              Crear Usuario
            </Link>
          </div>

          {/* Información de roles */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Permisos por Rol:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-white p-3 rounded border border-blue-100">
                <p className="font-semibold text-purple-700 flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4" /> Admin
                </p>
                <p className="text-gray-600 text-xs">
                  Acceso total: Crear, editar y eliminar docentes, horarios, establecimientos y usuarios.
                </p>
              </div>
              <div className="bg-white p-3 rounded border border-blue-100">
                <p className="font-semibold text-blue-700 flex items-center gap-2 mb-1">
                  <User className="w-4 h-4" /> Profesor
                </p>
                <p className="text-gray-600 text-xs">
                  Solo lectura de su propio horario y perfil. No puede editar.
                </p>
              </div>
              <div className="bg-white p-3 rounded border border-blue-100">
                <p className="font-semibold text-gray-700 flex items-center gap-2 mb-1">
                  <UserCog className="w-4 h-4" /> Visualizador
                </p>
                <p className="text-gray-600 text-xs">
                  Solo lectura de todos los datos. No puede editar nada.
                </p>
              </div>
            </div>
          </div>

          {/* Tabla de usuarios */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando usuarios...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Rol Actual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Cambiar Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Fecha Registro
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.rol)}
                          <span className="font-medium text-gray-800">
                            {user.nombre_completo}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user.rol)}`}>
                          {getRoleIcon(user.rol)}
                          {user.rol.charAt(0).toUpperCase() + user.rol.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={user.rol}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'admin' || val === 'profesor' || val === 'visualizador') {
                                updateUserRole(user.id, val);
                            }
                          }}
                          disabled={updating === user.id}
                          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="admin">Admin</option>
                          <option value="profesor">Profesor</option>
                          <option value="visualizador">Visualizador</option>
                        </select>
                        {updating === user.id && (
                          <span className="ml-2 text-xs text-gray-500">Actualizando...</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('es-CL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No hay usuarios registrados
                </div>
              )}
            </div>
          )}

          {/* Footer info */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Nota:</strong> Los cambios de rol son inmediatos. Los usuarios deben cerrar sesión y volver a iniciar para ver los cambios reflejados.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
