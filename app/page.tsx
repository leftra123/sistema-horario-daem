'use client';

import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  Calendar,
  School,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { getHorasLectivasDocente, getHorasUsadasEnBloques } from '@/lib/utils/calculos-horas';

export default function Home() {
  const router = useRouter();
  const { docentes, establecimientos, horarios } = useAppStore();

  // Estadísticas rápidas
  const totalDocentes = docentes.length;
  const totalEstablecimientos = establecimientos.length;
  const totalHorasContratadas = docentes.reduce((sum, d) =>
    sum + d.asignaciones.reduce((s, a) => s + a.horasContrato, 0), 0
  );

  const totalHorasLectivas = docentes.reduce((sum, d) =>
    sum + getHorasLectivasDocente(d, establecimientos), 0
  );

  const totalHorasUsadas = docentes.reduce((sum, d) =>
    sum + getHorasUsadasEnBloques(d.id, horarios), 0
  );

  const porcentajeAsignado = totalHorasLectivas > 0
    ? Math.round((totalHorasUsadas / totalHorasLectivas) * 100)
    : 0;

  const cursosConHorario = Object.keys(horarios).length;

  const menuOptions = [
    {
      title: 'Panel de Control',
      description: 'Estadísticas y resumen general del sistema',
      icon: LayoutDashboard,
      href: '/dashboard',
      color: 'bg-blue-500',
      stats: `${totalDocentes} docentes activos`
    },
    {
      title: 'Gestión de Docentes',
      description: 'Ver, agregar y editar planta docente',
      icon: Users,
      href: '/docentes',
      color: 'bg-emerald-500',
      stats: `${totalHorasUsadas}h asignadas de ${totalHorasLectivas}h`
    },
    {
      title: 'Constructor de Horarios',
      description: 'Crear y editar horarios por curso',
      icon: Calendar,
      href: '/horario',
      color: 'bg-purple-500',
      stats: `${cursosConHorario} cursos con horario`
    },
    {
      title: 'Establecimientos',
      description: 'Gestionar escuelas y configuraciones',
      icon: School,
      href: '/dashboard',
      color: 'bg-amber-500',
      stats: `${totalEstablecimientos} establecimientos`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-emerald-50 to-blue-50">
      {/* Hero Section Mejorado */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-emerald-600 text-white overflow-hidden">
        {/* Patrón de fondo sutil */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}/>
        </div>

        <div className="relative max-w-[1600px] mx-auto px-6 py-12 md:py-16">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Texto Principal */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                <Badge variant="secondary" className="bg-white text-blue-700 font-bold">
                  Ley 20.903
                </Badge>
                <span className="text-sm font-medium">Carrera Docente</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
                Sistema de Carga Horaria
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 font-medium mb-6">
                DAEM Galvarino
              </p>
              <p className="text-base md:text-lg text-blue-50 max-w-2xl">
                Gestión integral de horarios y dotación docente conforme a normativa
                educacional chilena
              </p>
            </div>

            {/* Logo Municipal */}
            <div className="flex-shrink-0">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white/20">
                <div className="relative w-32 h-32 md:w-40 md:h-40">
                  <Image
                    src="/Logo-Municipal-2026.png"
                    alt="Logo Municipal 2026"
                    fill
                    className="object-contain drop-shadow-lg"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Onda decorativa */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="rgb(239 246 255)"/>
          </svg>
        </div>
      </div>

      {/* Stats Bar Mejorado */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white transform hover:scale-105 transition-transform">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-100 font-medium">Docentes</p>
                  <p className="text-3xl font-extrabold">{totalDocentes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white transform hover:scale-105 transition-transform">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-emerald-100 font-medium">Horas Totales</p>
                  <p className="text-3xl font-extrabold">{totalHorasContratadas}h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white transform hover:scale-105 transition-transform">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-100 font-medium">Asignación</p>
                  <p className="text-3xl font-extrabold">{porcentajeAsignado}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white transform hover:scale-105 transition-transform">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-amber-100 font-medium">Cursos</p>
                  <p className="text-3xl font-extrabold">{cursosConHorario}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Menu Mejorado */}
      <div className="max-w-[1600px] mx-auto px-6 py-12">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">¿Qué deseas hacer?</h2>
          <p className="text-lg text-gray-600">Selecciona un módulo para comenzar a trabajar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card
                key={option.title}
                className="group hover:shadow-2xl hover:border-blue-300 transition-all duration-300 cursor-pointer border-2 border-gray-100 overflow-hidden bg-white"
                onClick={() => router.push(option.href)}
              >
                <CardHeader className="pb-4 bg-gradient-to-br from-gray-50 to-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`${option.color} p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <div>
                        <CardTitle className="text-xl mb-2 text-gray-800 group-hover:text-blue-600 transition-colors">
                          {option.title}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600">
                          {option.description}
                        </CardDescription>
                      </div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-2 transition-all" />
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-semibold py-1.5 px-3">
                      {option.stats}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-semibold"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(option.href);
                      }}
                    >
                      Abrir módulo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Info Section */}
      <div className="max-w-[1600px] mx-auto px-6 pb-12">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <School className="w-5 h-5 text-blue-600" />
                  Establecimientos Activos
                </h3>
                <div className="space-y-1">
                  {establecimientos.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay establecimientos registrados</p>
                  ) : (
                    establecimientos.slice(0, 3).map(est => (
                      <p key={est.id} className="text-sm text-gray-700">
                        • {est.nombre} ({est.niveles})
                      </p>
                    ))
                  )}
                  {establecimientos.length > 3 && (
                    <p className="text-sm text-blue-600 font-medium">
                      +{establecimientos.length - 3} más
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Estado de Asignación
                </h3>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Horas Asignadas</span>
                      <span className="font-semibold text-gray-800">{totalHorasUsadas}h / {totalHorasLectivas}h</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all"
                        style={{ width: `${porcentajeAsignado}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {totalHorasLectivas - totalHorasUsadas}h disponibles para asignar
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  Acciones Rápidas
                </h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => router.push('/docentes')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Agregar Docente
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => router.push('/horario')}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Crear Horario
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Mejorado */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-8 mt-16">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                <Image
                  src="/DAEM.png"
                  alt="DAEM Logo"
                  fill
                  className="object-contain opacity-90"
                />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-300">
                  Sistema de Carga Horaria DAEM Galvarino
                </p>
                <p className="text-xs text-gray-400">
                  Cumplimiento Ley 20.903 (Carrera Docente)
                </p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs text-gray-400">
                Gestión integral de dotación docente y horarios escolares
              </p>
              <p className="text-xs text-gray-500 mt-1">
                © 2026 Municipalidad de Galvarino
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
