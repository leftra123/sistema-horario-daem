'use client';

import { useState, useMemo, memo } from 'react';
import { useAppStore } from '@/lib/store';
import { ASIGNATURAS_BASE, DIAS, BloqueHorario, BloqueConfig } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Trash2, FileSpreadsheet, FileDown, Wand2, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getHorasLectivasDocente, getHorasUsadasEnBloques, tieneConflictoHorario } from '@/lib/utils/calculos-horas';
import {
  exportarHorarioCursoExcel,
  exportarHorarioCursoPDF
} from '@/lib/utils/export-horarios';
import { autoGenerarHorarioCurso, aplicarAutoGeneracion } from '@/lib/utils/auto-generador-horarios';

// Componente de Celda Memoizado para optimización (Tarea 6)
interface BloqueCellProps {
  dia: string;
  bloqueId: number;
  bloqueData?: BloqueHorario;
  asignaturaSel: number | null;
  docenteSel: string;
  diaBloqueado?: boolean;
  conflictoInfo?: {
    conflicto: boolean;
    cursoKey?: string;
    establecimientoId?: number;
    establecimientoNombre?: string;
  };
  establecimientoActualId?: number; // Para comparar si el conflicto es en otro colegio
  onAsignar: (dia: string, bloqueId: number) => void;
  onEliminar: (dia: string, bloqueId: number) => void;
}

const BloqueCell = memo(({ dia, bloqueId, bloqueData, asignaturaSel, docenteSel, diaBloqueado, conflictoInfo, establecimientoActualId, onAsignar, onEliminar }: BloqueCellProps) => {
  if (bloqueData) {
    return (
      <td className="p-1 border-r border-b h-24 align-top">
        <div
          className="h-full w-full p-2 rounded-lg text-white shadow-sm cursor-pointer hover:opacity-90 transition-all group relative flex flex-col justify-center"
          style={{ backgroundColor: bloqueData.asignatura.color }}
          onClick={() => onEliminar(dia, bloqueId)}
        >
          <p className="font-bold text-xs text-center leading-tight mb-1">
            {bloqueData.asignatura.nombre}
          </p>
          <p className="text-[10px] text-center opacity-90 truncate px-1">
            {bloqueData.docenteNombre}
          </p>
          <button className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-white/20 hover:bg-white/30 rounded p-1 transition-all">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </td>
    );
  }

  // Celda vacía con indicadores de bloqueo
  const tieneConflicto = conflictoInfo?.conflicto || false;
  const estaBloqueado = diaBloqueado || tieneConflicto;

  // Determinar si el conflicto es en otro establecimiento
  const esConflictoInterEscolar = tieneConflicto &&
    conflictoInfo?.establecimientoId &&
    establecimientoActualId &&
    conflictoInfo.establecimientoId !== establecimientoActualId;

  // Extraer información del curso desde cursoKey (formato: "estId-nivel-seccion")
  const cursoNombre = conflictoInfo?.cursoKey?.split('-').slice(1).join('-') || '';

  return (
    <td className="p-1 border-r border-b h-24">
      <div
        onClick={() => !estaBloqueado && onAsignar(dia, bloqueId)}
        className={`h-full w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-all relative ${
          diaBloqueado
            ? 'border-red-300 bg-red-50 text-red-300 cursor-not-allowed opacity-50'
            : esConflictoInterEscolar
            ? 'border-purple-400 bg-purple-50 text-purple-600 cursor-not-allowed opacity-75'
            : tieneConflicto
            ? 'border-orange-400 bg-orange-50 text-orange-500 cursor-not-allowed opacity-70'
            : asignaturaSel && docenteSel
            ? 'border-emerald-400 bg-emerald-50 text-emerald-400 cursor-pointer hover:bg-emerald-100 hover:border-emerald-500'
            : 'border-gray-200 text-gray-300 cursor-not-allowed'
        }`}
      >
        {diaBloqueado ? (
          <>
            <span className="text-2xl mb-1">🚫</span>
            <span className="text-[9px] text-red-400 font-semibold">Bloqueado</span>
          </>
        ) : esConflictoInterEscolar ? (
          <>
            <span className="text-xl mb-1">🏫</span>
            <span className="text-[7px] text-purple-700 font-bold text-center px-1 leading-tight">
              {conflictoInfo?.establecimientoNombre}
            </span>
            <span className="text-[7px] text-purple-600 font-semibold text-center px-1">
              {cursoNombre}
            </span>
          </>
        ) : tieneConflicto ? (
          <>
            <span className="text-xl mb-1">⚠️</span>
            <span className="text-[8px] text-orange-600 font-semibold text-center px-1">
              En {cursoNombre}
            </span>
          </>
        ) : (
          <span className="text-2xl">+</span>
        )}
      </div>
    </td>
  );
});

BloqueCell.displayName = 'BloqueCell';

export default function HorarioPage() {
  const {
    establecimientos,
    docentes,
    horarios,
    asignarBloque,
    removeBloque,
    getBloquesPorEstablecimiento
  } = useAppStore();

  const [establecimientoSel, setEstablecimientoSel] = useState<string>('');
  const [cursoSel, setCursoSel] = useState<string>('');
  const [asignaturaSel, setAsignaturaSel] = useState<number | null>(null);
  const [docenteSel, setDocenteSel] = useState<string>('');

  // Generar cursos según el establecimiento seleccionado
  const cursos = useMemo(() => {
    if (!establecimientoSel) return [];
    const est = establecimientos.find(e => e.id.toString() === establecimientoSel);
    if (!est) return [];

    const cursosList: string[] = [];
    const [min, max] = est.niveles.split('-').map(Number);
    
    for (let i = min; i <= max; i++) {
      (est.secciones || ['A']).forEach(sec => {
        const nombre = i <= 8 
          ? `${i}° Básico ${sec}` 
          : `${i - 8}° Medio ${sec}`;
        cursosList.push(nombre);
      });
    }
    
    return cursosList;
  }, [establecimientoSel, establecimientos]);

  // Bloques configurables del establecimiento seleccionado
  const bloques = useMemo(() => {
    if (!establecimientoSel) return [];
    return getBloquesPorEstablecimiento(parseInt(establecimientoSel));
  }, [establecimientoSel, getBloquesPorEstablecimiento]);

  // Docentes del establecimiento seleccionado
  const docentesDelEstablecimiento = useMemo(() => {
    if (!establecimientoSel) return [];
    return docentes.filter(d =>
      d.asignaciones?.some(a => a.establecimientoId.toString() === establecimientoSel)
    );
  }, [docentes, establecimientoSel]);

  // Asignaturas del establecimiento seleccionado (usa personalizadas si existen)
  const asignaturasDelEstablecimiento = useMemo(() => {
    if (!establecimientoSel) return ASIGNATURAS_BASE;
    const est = establecimientos.find(e => e.id.toString() === establecimientoSel);
    if (!est) return ASIGNATURAS_BASE;

    // Si tiene asignaturas personalizadas, usarlas; sino usar las base
    return est.asignaturas && est.asignaturas.length > 0
      ? est.asignaturas
      : ASIGNATURAS_BASE;
  }, [establecimientoSel, establecimientos]);

  // Horario actual
  const horarioKey = `${establecimientoSel}-${cursoSel}`;
  const horarioActual = horarios[horarioKey] || {};

  // Calcular horas disponibles de un docente
  const getHorasDisponibles = (docenteId: number) => {
    const docente = docentes.find(d => d.id === docenteId);
    if (!docente) return 0;

    const totalHoras = docente.asignaciones.reduce((sum, a) => sum + a.horasContrato, 0);
    const horasUsadas = getHorasUsadasEnBloques(docenteId, horarios);
    return totalHoras - horasUsadas;
  };

  // Manejar asignación de bloque
  const handleAsignarBloque = (dia: string, bloqueId: number) => {
    if (!asignaturaSel || !docenteSel) {
      toast.error('Selecciona una asignatura y un docente primero');
      return;
    }

    const asignatura = asignaturasDelEstablecimiento.find(a => a.id === asignaturaSel);
    if (!asignatura) return;

    const result = asignarBloque(
      horarioKey,
      dia,
      bloqueId,
      asignatura,
      parseInt(docenteSel)
    );

    if (!result.success) {
      toast.error(result.error || 'Error al asignar bloque');
    } else {
      toast.success('✅ Bloque asignado correctamente');
    }
  };

  // Manejar eliminación de bloque
  const handleRemoveBloque = (dia: string, bloqueId: number) => {
    const bloqueKey = `${dia}-${bloqueId}`;
    removeBloque(horarioKey, bloqueKey);
    toast.success('Bloque eliminado');
  };

  // Manejar auto-generación de horario
  const handleAutoGenerar = () => {
    if (!establecimientoSel || !cursoSel) {
      toast.error('Selecciona un curso primero');
      return;
    }

    const confirmacion = window.confirm(
      `¿Deseas auto-generar el horario para ${cursoSel}?\n\n` +
      'Esto intentará llenar todos los bloques vacíos automáticamente respetando:\n' +
      '✓ Horas lectivas disponibles de cada docente\n' +
      '✓ Días bloqueados\n' +
      '✓ Conflictos de horario\n\n' +
      'Los bloques ya asignados NO se modificarán.'
    );

    if (!confirmacion) return;

    // Ejecutar generación
    const resultado = autoGenerarHorarioCurso(
      horarioKey,
      parseInt(establecimientoSel),
      docentes,
      asignaturasDelEstablecimiento,
      bloques,
      horarios,
      establecimientos
    );

    // Aplicar asignaciones
    const { exitosos, fallidos, errores } = aplicarAutoGeneracion(
      resultado.asignaciones,
      horarioKey,
      (cursoKey, dia, bloqueId, asignatura, docenteId) =>
        asignarBloque(cursoKey, dia, bloqueId, asignatura, docenteId)
    );

    // Mostrar resultado
    if (resultado.exito) {
      toast.success(`🎉 ¡Horario generado! ${exitosos} bloques asignados automáticamente`);
    } else if (exitosos > 0) {
      toast.warning(
        `⚠️ Generación parcial: ${exitosos} bloques asignados, ${resultado.bloquesSinAsignar.length} sin asignar`,
        { duration: 5000 }
      );
    } else {
      toast.error('❌ No se pudo auto-generar el horario. Verifica que haya docentes con horas disponibles.');
    }

    console.log('📊 Resultado auto-generación:', resultado.mensajes);
    if (errores.length > 0) {
      console.error('❌ Errores:', errores);
    }
  };

  const asignaturaSeleccionada = asignaturasDelEstablecimiento.find(a => a.id === asignaturaSel);
  const docenteSeleccionado = docentes.find(d => d.id === parseInt(docenteSel));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-emerald-50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Top Bar Mejorado: Selector de Escuela y Curso */}
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl shadow-xl p-6 mb-2">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Título */}
                <div className="flex items-center gap-3 text-white">
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                        <Calendar className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold">Constructor de Horarios</h1>
                        <p className="text-blue-100 text-sm">Selecciona establecimiento y curso para comenzar</p>
                    </div>
                </div>

                <div className="h-12 w-px bg-white/20 hidden md:block" />

                {/* Selectores */}
                <div className="flex flex-col md:flex-row gap-3 flex-1 w-full">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-xs font-bold text-white/90 uppercase mb-1.5 block tracking-wide">
                            Establecimiento
                        </label>
                        <Select
                            value={establecimientoSel}
                            onValueChange={(v) => {
                                setEstablecimientoSel(v);
                                setCursoSel('');
                                setDocenteSel('');
                            }}
                        >
                            <SelectTrigger className="w-full bg-white/90 backdrop-blur-sm border-2 border-white/50 h-11 text-base font-semibold">
                                <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                                {establecimientos.length === 0 ? (
                                    <SelectItem value="none" disabled>No hay establecimientos</SelectItem>
                                ) : (
                                    establecimientos.map(e => (
                                        <SelectItem key={e.id} value={e.id.toString()}>
                                            {e.nombre}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {establecimientoSel && (
                        <div className="flex-1 min-w-[180px]">
                            <label className="text-xs font-bold text-white/90 uppercase mb-1.5 block tracking-wide">
                                Curso
                            </label>
                            <Select value={cursoSel} onValueChange={setCursoSel}>
                                <SelectTrigger className="w-full bg-white/90 backdrop-blur-sm border-2 border-white/50 h-11 text-base font-semibold">
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {cursos.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {/* Indicador de curso seleccionado */}
                {cursoSel && (
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/30">
                        <p className="text-xs text-white/80 font-semibold uppercase tracking-wide">Editando</p>
                        <p className="text-sm font-bold text-white">{cursoSel}</p>
                    </div>
                )}
            </div>
        </div>

        {!establecimientoSel ? (
           <Alert className="bg-amber-50 border-amber-200 max-w-2xl mx-auto mt-10">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>⬅️ Comienza seleccionando una escuela</strong>
              <p className="mt-2">
                Para comenzar a editar horarios, selecciona el establecimiento y luego el curso.
              </p>
            </AlertDescription>
          </Alert>
        ) : (
        <div className="grid grid-cols-12 gap-6">
          
          {/* Panel Izquierdo / Central - Grilla de Horario Mejorada */}
          <div className="col-span-12 lg:col-span-9">
            {cursoSel ? (
              <Card className="shadow-xl border-2 border-blue-200 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold">
                          Horario {cursoSel}
                      </CardTitle>
                      <div className="text-sm text-blue-100 mt-1 font-medium">
                          {establecimientos.find(e => e.id.toString() === establecimientoSel)?.nombre}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Button
                        onClick={handleAutoGenerar}
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-purple-600 text-white hover:bg-purple-700 border-0 shadow-lg font-semibold"
                      >
                        <Wand2 className="h-4 w-4" />
                        Auto-generar
                      </Button>

                      <div className="h-6 w-px bg-white/30 mx-1 hidden md:block" />

                      <span className="text-xs text-blue-100 font-semibold hidden md:inline">Exportar:</span>
                      <Button
                        onClick={() => {
                          const est = establecimientos.find(e => e.id.toString() === establecimientoSel);
                          if (est) {
                            const filename = exportarHorarioCursoExcel(
                              cursoSel,
                              est.nombre,
                              horarioActual,
                              bloques
                            );
                            toast.success(`✅ Exportado: ${filename}`);
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-white text-emerald-700 hover:bg-emerald-50 border-0 font-semibold shadow-md"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        Excel
                      </Button>
                      <Button
                        onClick={() => {
                          const est = establecimientos.find(e => e.id.toString() === establecimientoSel);
                          if (est) {
                            const filename = exportarHorarioCursoPDF(
                              cursoSel,
                              est.nombre,
                              horarioActual,
                              bloques
                            );
                            toast.success(`✅ Exportado: ${filename}`);
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-white text-blue-700 hover:bg-blue-50 border-0 font-semibold shadow-md"
                      >
                        <FileDown className="h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full table-fixed border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b">
                          <th className="p-3 text-xs font-bold text-gray-500 uppercase w-24 border-r">Bloque</th>
                          {DIAS.map(d => (
                            <th key={d} className="p-3 text-xs font-bold text-gray-600 uppercase border-r text-center">
                              {d}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bloques.map(b => (
                          <tr key={b.id} className={`border-b ${b.tipo !== 'clase' ? 'bg-gray-100' : 'hover:bg-gray-50/50'}`}>
                            <td className="p-2 text-[10px] text-gray-400 text-center font-mono border-r bg-gray-50/30">
                              <span className="font-bold block text-gray-600">{b.id}</span>
                              <span className="block">{b.horaInicio} - {b.horaFin}</span>
                              {b.tipo !== 'clase' && (
                                <Badge className="mt-1 text-[9px]" variant="secondary">
                                  {b.tipo === 'recreo' ? '☕ Recreo' : '🍽️ Colación'}
                                </Badge>
                              )}
                            </td>
                            {b.tipo === 'clase' ? (
                              DIAS.map(d => {
                                const bloqueKey = `${d}-${b.id}`;
                                const bloque = horarioActual[bloqueKey];

                                // Verificar si el día está bloqueado para el docente seleccionado
                                let diaBloqueado = false;
                                let conflictoInfo: {
                                  conflicto: boolean;
                                  cursoKey?: string;
                                  establecimientoId?: number;
                                  establecimientoNombre?: string;
                                } | undefined = undefined;

                                if (docenteSel && establecimientoSel) {
                                  const docente = docentes.find(doc => doc.id.toString() === docenteSel);
                                  if (docente) {
                                    const asignacion = docente.asignaciones.find(
                                      a => a.establecimientoId === parseInt(establecimientoSel)
                                    );
                                    diaBloqueado = asignacion?.diasBloqueados?.includes(d) || false;

                                    // Verificar conflicto de horario (solo si no está bloqueado y no hay bloque ya asignado)
                                    if (!diaBloqueado && !bloque) {
                                      const cursoConflicto = tieneConflictoHorario(
                                        parseInt(docenteSel),
                                        d,
                                        b.id,
                                        horarioKey,
                                        horarios
                                      );

                                      if (cursoConflicto) {
                                        conflictoInfo = { conflicto: true, cursoKey: cursoConflicto };
                                      }
                                    }
                                  }
                                }

                                return (
                                  <BloqueCell
                                    key={bloqueKey}
                                    dia={d}
                                    bloqueId={b.id}
                                    bloqueData={bloque}
                                    asignaturaSel={asignaturaSel}
                                    docenteSel={docenteSel}
                                    diaBloqueado={diaBloqueado}
                                    conflictoInfo={conflictoInfo}
                                    establecimientoActualId={parseInt(establecimientoSel)}
                                    onAsignar={handleAsignarBloque}
                                    onEliminar={handleRemoveBloque}
                                  />
                                );
                              })
                            ) : (
                              <td colSpan={5} className="text-center text-gray-400 text-xs py-3">
                                {b.tipo === 'recreo' ? '☕ Recreo' : '🍽️ Colación'} - {b.duracionMinutos} minutos
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </CardContent>
              </Card>
            ) : (
               <div className="flex flex-col items-center justify-center h-96 border-4 border-dashed border-gray-200 rounded-xl text-gray-400">
                  <div className="text-6xl mb-4 opacity-50">👆</div>
                  <p className="text-xl font-medium">Selecciona un curso arriba</p>
                  <p className="text-sm">para ver su horario</p>
               </div>
            )}
          </div>

          {/* Panel Lateral Derecho Mejorado - Controles y Docentes */}
          <div className="col-span-12 lg:col-span-3 space-y-5">

            {cursoSel && (
                <>
                {/* Selector Asignatura Mejorado */}
                <Card className="border-2 border-blue-200 shadow-lg bg-white">
                    <CardHeader className="pb-3 pt-5 px-5 bg-gradient-to-r from-blue-50 to-emerald-50">
                        <CardTitle className="text-base font-bold text-blue-800 flex items-center gap-2">
                            <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                            Asignatura
                        </CardTitle>
                        <p className="text-xs text-gray-600 mt-1">Selecciona la materia a asignar</p>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 pt-4">
                        <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                            {asignaturasDelEstablecimiento.map(a => (
                                <button
                                    key={a.id}
                                    onClick={() => setAsignaturaSel(a.id)}
                                    className={`p-2.5 rounded-lg text-[11px] font-bold text-left transition-all truncate shadow-md hover:shadow-lg ${
                                    asignaturaSel === a.id
                                        ? 'text-white ring-2 ring-blue-500 ring-offset-2 scale-105'
                                        : 'text-white opacity-85 hover:opacity-100 hover:scale-[1.02]'
                                    }`}
                                    style={{
                                        backgroundColor: a.color
                                    }}
                                >
                                    {a.nombre}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Selector Docente Mejorado */}
                <Card className="border-2 border-emerald-200 shadow-lg bg-white flex-1">
                    <CardHeader className="pb-3 pt-5 px-5 bg-gradient-to-r from-emerald-50 to-blue-50">
                        <CardTitle className="text-base font-bold text-emerald-800 flex items-center gap-2">
                            <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                            Docente
                        </CardTitle>
                        <p className="text-xs text-gray-600 mt-1">Elige el profesor que impartirá</p>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        {docentesDelEstablecimiento.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-xs">
                                No hay docentes asignados a esta escuela.
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[calc(100vh-500px)] overflow-y-auto pr-2">
                                {docentesDelEstablecimiento.map(d => {
                                    const horasDisponibles = getHorasDisponibles(d.id);
                                    const sinHoras = horasDisponibles <= 0;
                                    const isSelected = docenteSel === d.id.toString();

                                    return (
                                        <button
                                            key={d.id}
                                            onClick={() => !sinHoras && setDocenteSel(d.id.toString())}
                                            disabled={sinHoras}
                                            className={`w-full p-2.5 rounded-lg text-left transition-all border ${
                                                isSelected
                                                ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500'
                                                : sinHoras
                                                ? 'bg-gray-50 opacity-60 cursor-not-allowed border-gray-100'
                                                : 'bg-white hover:bg-gray-50 border-gray-200'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <p className={`font-semibold text-xs ${isSelected ? 'text-emerald-900' : 'text-gray-700'}`}>
                                                    {d.nombre}
                                                </p>
                                                {isSelected && <span className="text-[10px] bg-emerald-500 text-white px-1.5 rounded-full">✓</span>}
                                            </div>
                                            
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${sinHoras ? 'bg-red-400' : 'bg-emerald-400'}`}
                                                        style={{ width: `${Math.min(100, (getHorasUsadasEnBloques(d.id, horarios) / (d.asignaciones.reduce((s,a)=>s+a.horasContrato,0) || 1)) * 100)}%` }}
                                                    />
                                                </div>
                                                <span className={`text-[10px] whitespace-nowrap ${sinHoras ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                                                    {horasDisponibles}h disp.
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Indicador de Límite de Horas Lectivas */}
                {docenteSel && (() => {
                  const docente = docentes.find(d => d.id === parseInt(docenteSel));
                  if (!docente) return null;

                  const horasLectivas = getHorasLectivasDocente(docente, establecimientos);
                  const horasUsadas = getHorasUsadasEnBloques(parseInt(docenteSel), horarios);
                  const disponibles = Math.max(0, horasLectivas - horasUsadas);
                  const porcentajeUsado = horasLectivas > 0 ? (horasUsadas / horasLectivas) * 100 : 0;

                  return (
                    <Alert className={`border-2 ${disponibles === 0 ? 'border-red-500 bg-red-50' : disponibles <= 5 ? 'border-orange-500 bg-orange-50' : 'border-blue-500 bg-blue-50'}`}>
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-gray-700 mb-2">📊 Horas Lectivas (Tabla 2019)</p>

                          <div className="flex justify-between text-sm items-center">
                            <span className="text-gray-600">Total Lectivas:</span>
                            <span className="font-bold text-blue-700">{horasLectivas}h</span>
                          </div>

                          <div className="flex justify-between text-sm items-center">
                            <span className="text-gray-600">Horas Usadas:</span>
                            <span className="font-bold text-emerald-600">{horasUsadas}h</span>
                          </div>

                          {/* Barra de progreso */}
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                disponibles === 0
                                  ? 'bg-red-500'
                                  : disponibles <= 5
                                  ? 'bg-orange-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, porcentajeUsado)}%` }}
                            />
                          </div>

                          <div className="flex justify-between text-sm items-center pt-1 border-t">
                            <span className="text-gray-600 font-semibold">Disponibles:</span>
                            <span className={`font-bold text-lg ${
                              disponibles === 0
                                ? 'text-red-600'
                                : disponibles <= 5
                                ? 'text-orange-600'
                                : 'text-emerald-600'
                            }`}>
                              {disponibles}h
                            </span>
                          </div>

                          {disponibles === 0 && (
                            <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700">
                              <strong>🚫 Límite alcanzado:</strong> Este docente ha usado todas sus horas lectivas según Tabla 2019. No puede recibir más asignaciones.
                            </div>
                          )}

                          {disponibles > 0 && disponibles <= 5 && (
                            <div className="mt-2 p-2 bg-orange-100 border border-orange-300 rounded text-xs text-orange-700">
                              <strong>⚠️ Pocas horas disponibles:</strong> Solo quedan {disponibles} horas lectivas.
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  );
                })()}

                {/* Resumen Mejorado */}
                {asignaturaSel && docenteSel && (
                     <div className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white p-5 rounded-2xl shadow-2xl text-center animate-in fade-in slide-in-from-bottom-4 border-2 border-white/20">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5" />
                            <p className="text-sm font-bold uppercase tracking-wide">Listo para asignar</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 mt-2">
                            <p className="text-base font-extrabold">
                                {asignaturaSeleccionada?.codigo}
                            </p>
                            <p className="text-xs text-white/90 mt-1">
                                con {docenteSeleccionado?.nombre.split(' ')[0]}
                            </p>
                        </div>
                        <p className="text-xs text-white/80 mt-3 font-medium">
                            Haz clic en una celda verde para asignar
                        </p>
                     </div>
                )}
                </>
            )}

          </div>
        </div>
        )}
      </div>
    </div>
  );
}

