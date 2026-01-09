'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Home, Calendar, Users, LayoutDashboard, LogOut, UserCog } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { href: '/docentes', label: 'Docentes', icon: Users },
  { href: '/horario', label: 'Horarios', icon: Calendar },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isAuthenticated, isAdmin } = useAuth();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    // ✅ FIX: Usar router.push en vez de window.location para client-side navigation
    router.push('/login');
  }

  // No mostrar navegación si no está autenticado
  if (!isAuthenticated) return null;

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-lg border-b-4 border-blue-600">
      <div className="max-w-[1600px] mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo y Título */}
          <Link href="/" className="flex items-center gap-4 group">
            <div className="relative w-14 h-14 flex-shrink-0">
              <Image
                src="/DAEM.png"
                alt="DAEM Logo"
                fill
                className="object-contain group-hover:scale-105 transition-transform"
                priority
              />
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-blue-800 leading-tight">
                Sistema de Carga Horaria
              </h1>
              <p className="text-sm text-emerald-600 font-semibold">
                DAEM Galvarino
              </p>
            </div>
          </Link>

          {/* Navegación */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}

            {/* Link a gestión de usuarios (solo admin) */}
            {isAdmin && (
              <Link
                href="/admin/usuarios"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  pathname === '/admin/usuarios'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/30'
                    : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                <UserCog className="w-4 h-4" />
                <span className="hidden sm:inline">Usuarios</span>
              </Link>
            )}

            {/* Separador */}
            <div className="h-8 w-px bg-gray-300 mx-2"></div>

            {/* Usuario info y logout */}
            <div className="flex items-center gap-3">
              <Link
                href="/perfil"
                className="text-right hidden md:block hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <p className="text-sm font-semibold text-gray-800">
                  {profile?.nombre_completo}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded capitalize ${
                    profile?.rol === 'admin'
                      ? 'bg-red-100 text-red-700 border border-red-300'
                      : profile?.rol === 'profesor'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}>
                    {profile?.rol === 'admin' ? '👑 Admin' : profile?.rol === 'profesor' ? '👨‍🏫 Profesor' : '👁️ Visualizador'}
                  </span>
                </div>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de información */}
      <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-4 py-2">
        <p className="text-white text-xs text-center font-medium flex items-center justify-center gap-2">
          <span className="hidden sm:inline">📚 Ley 20.903 - Carrera Docente</span>
          <span className="hidden sm:inline">•</span>
          <span>Máximo 44 horas semanales</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Proporción horas lectivas/no lectivas según ciclo</span>
        </p>
      </div>
    </nav>
  );
}

