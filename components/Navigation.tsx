'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Home, Calendar, Users, LayoutDashboard } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { href: '/docentes', label: 'Docentes', icon: Users },
  { href: '/horario', label: 'Horarios', icon: Calendar },
];

export function Navigation() {
  const pathname = usePathname();

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
          <span className="hidden sm:inline">60/40 y 65/35 horas lectivas/no lectivas</span>
        </p>
      </div>
    </nav>
  );
}

