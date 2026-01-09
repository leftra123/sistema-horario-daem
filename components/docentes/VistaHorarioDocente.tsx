'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { Docente, DIAS } from '@/types';
import { useAppStore } from '@/lib/store';
import { getHorasLectivasDocente, getHorasUsadasEnBloques } from '@/lib/utils/calculos-horas';

interface VistaHorarioDocenteProps {
  docente: Docente;
}

export default function VistaHorarioDocente({ docente }: VistaHorarioDocenteProps) {
  const { horarios, establecimientos, getBloquesPorEstablecimiento } = useAppStore();

  // Obtener el establecimiento principal del docente (primera asignación)
  const establecimientoPrincipal = useMemo(() => {
    if (docente.asignaciones.length === 0) return null;
    const estId = docente.asignaciones[0].establecimientoId;
    return establecimientos.find(e => e.id === estId);
  }, [docente, establecimientos]);

  // Obtener bloques del establecimiento principal
  const bloques = useMemo(() => {
    if (!establecimientoPrincipal) return [];
    return getBloquesPorEstablecimiento(establecimientoPrincipal.id);
  }, [establecimientoPrincipal, getBloquesPorEstablecimiento]);

  // Bloques solo de clase (sin recreos ni colación)
  const bloquesClase = useMemo(() => {
    return bloques.filter(b => b.tipo === 'clase');
  }, [bloques]);

  // Calcular horas lectivas y no lectivas
  const estadisticas = useMemo(() => {
    const horasLectivas = getHorasLectivasDocente(docente, establecimientos);
    const horasUsadas = getHorasUsadasEnBloques(docente.id, horarios);
    const horasNoLectivas = docente.asignaciones.reduce((sum, a) => sum + a.horasContrato, 0) - horasLectivas;

    return {
      horasLectivas,
      horasUsadas,
      horasNoLectivas,
      horasLibresLectivas: horasLectivas - horasUsadas
    };
  }, [docente, establecimientos, horarios]);

  // Encontrar todos los bloques donde está asignado el docente
  const bloquesAsignados = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const asignaciones: Record<string, { curso: string; asignatura: any; dia: string; bloqueId: number }> = {};

    Object.entries(horarios).forEach(([cursoKey, horarioCurso]) => {
      Object.entries(horarioCurso).forEach(([bloqueKey, bloqueData]) => {
        if (bloqueData.docenteId === docente.id) {
          const [dia, bloqueIdStr] = bloqueKey.split('-');
          asignaciones[bloqueKey] = {
            curso: cursoKey,
            asignatura: bloqueData.asignatura,
            dia,
            bloqueId: parseInt(bloqueIdStr)
          };
        }
      });
    });

    return asignaciones;
  }, [horarios, docente.id]);

  // Distribuir horas no lectivas equitativamente en la semana
  const bloquesNoLectivos = useMemo(() => {
    const noLectivos: Set<string> = new Set();
    const horasAsignadas = Object.keys(bloquesAsignados).length;
    const totalBloquesSemana = bloquesClase.length * DIAS.length;
    const bloquesLibres = totalBloquesSemana - horasAsignadas;

    // Calcular cuántos bloques no lectivos necesitamos
    const bloquesNoLectivosNecesarios = Math.min(
      Math.floor(estadisticas.horasNoLectivas),
      bloquesLibres
    );

    // Distribuir equitativamente en los días
    const bloquesPorDia = Math.floor(bloquesNoLectivosNecesarios / DIAS.length);
    let bloquesRestantes = bloquesNoLectivosNecesarios % DIAS.length;

    DIAS.forEach((dia) => {
      let bloquesAgregadosHoy = 0;
      const bloquesParaHoy = bloquesPorDia + (bloquesRestantes > 0 ? 1 : 0);
      if (bloquesRestantes > 0) bloquesRestantes--;

      for (const bloque of bloquesClase) {
        if (bloquesAgregadosHoy >= bloquesParaHoy) break;

        const bloqueKey = `${dia}-${bloque.id}`;
        // Solo agregar si el bloque está libre
        if (!bloquesAsignados[bloqueKey]) {
          noLectivos.add(bloqueKey);
          bloquesAgregadosHoy++;
        }
      }
    });

    return noLectivos;
  }, [bloquesClase, bloquesAsignados, estadisticas.horasNoLectivas]);

  if (!establecimientoPrincipal) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Calendar className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Horario del Docente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">Este docente no tiene asignaciones configuradas.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <Calendar className="w-4 h-4" />
          <span className="hidden md:inline">Ver Horario</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Horario de {docente.nombre}
          </DialogTitle>
        </DialogHeader>

        {/* Estadísticas */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-600 font-semibold mb-1">Horas Lectivas</p>
            <p className="text-2xl font-bold text-blue-700">{estadisticas.horasLectivas}h</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-600 font-semibold mb-1">Horas Asignadas</p>
            <p className="text-2xl font-bold text-green-700">{estadisticas.horasUsadas}h</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600 font-semibold mb-1">Horas No Lectivas</p>
            <p className="text-2xl font-bold text-gray-700">{estadisticas.horasNoLectivas}h</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-xs text-purple-600 font-semibold mb-1">Horas Libres</p>
            <p className="text-2xl font-bold text-purple-700">{estadisticas.horasLibresLectivas}h</p>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span>Clase asignada (Lectivas)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-200 border-2 border-amber-400"></div>
            <span>Hora no lectiva (Prep./Admin.)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-gray-200"></div>
            <span>Tiempo libre</span>
          </div>
        </div>

        {/* Tabla de Horario */}
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-emerald-600 to-teal-600">
                <th className="p-2 text-white font-semibold border-r border-white/20 w-32">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Bloque</span>
                  </div>
                </th>
                {DIAS.map(dia => (
                  <th key={dia} className="p-2 text-white font-semibold border-r last:border-r-0 border-white/20">
                    {dia}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bloquesClase.map(bloque => (
                <tr key={bloque.id} className="border-b hover:bg-gray-50/50">
                  <td className="p-2 text-[10px] text-gray-400 text-center font-mono border-r bg-gray-50/30">
                    <span className="font-bold block text-gray-600">#{bloque.id}</span>
                    {bloque.horaInicio} - {bloque.horaFin}
                  </td>
                  {DIAS.map(dia => {
                    const bloqueKey = `${dia}-${bloque.id}`;
                    const asignacion = bloquesAsignados[bloqueKey];
                    const esNoLectivo = bloquesNoLectivos.has(bloqueKey);

                    if (asignacion) {
                      // Bloque con clase asignada
                      const [, nivel, seccion] = asignacion.curso.split('-');
                      return (
                        <td key={dia} className="p-1 border-r h-20">
                          <div
                            className="h-full w-full p-2 rounded-lg text-white shadow-sm flex flex-col justify-center"
                            style={{ backgroundColor: asignacion.asignatura.color }}
                          >
                            <p className="font-bold text-[11px] text-center leading-tight mb-1">
                              {asignacion.asignatura.nombre}
                            </p>
                            <Badge variant="secondary" className="text-[9px] bg-white/20 text-white border-0 justify-center">
                              {nivel}-{seccion}
                            </Badge>
                          </div>
                        </td>
                      );
                    } else if (esNoLectivo) {
                      // Bloque de hora no lectiva (Prep./Admin.)
                      return (
                        <td key={dia} className="p-1 border-r h-20">
                          <div className="h-full w-full bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 rounded-lg flex flex-col items-center justify-center text-amber-700">
                            <span className="text-lg mb-1">📋</span>
                            <span className="text-[9px] font-bold">NO LECTIVA</span>
                            <span className="text-[8px] text-amber-600 mt-0.5">Prep./Admin.</span>
                          </div>
                        </td>
                      );
                    } else {
                      // Bloque libre
                      return (
                        <td key={dia} className="p-1 border-r h-20">
                          <div className="h-full w-full border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-300">
                            <span className="text-sm">—</span>
                          </div>
                        </td>
                      );
                    }
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Información adicional */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
          <p className="text-blue-700">
            <strong>ℹ️ Información:</strong> Este horario muestra todas las clases asignadas al docente.
            Las horas no lectivas ({estadisticas.horasNoLectivas}h) se distribuyen automáticamente
            para preparación de clases, reuniones y tareas administrativas según la proporción{' '}
            {establecimientoPrincipal.prioritarios ? '60/40' : '65/35'} del establecimiento.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
