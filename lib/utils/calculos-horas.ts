// Funciones para cálculo de horas lectivas/no lectivas según Ley 20.903

import { Docente, Asignacion, Establecimiento } from '@/types';
import { TABLA_60_40, TABLA_65_35, TablaEntry } from '@/lib/constants/tablas-horas';

/**
 * Calcula el total de horas de una asignación
 * Si tiene desglose, suma los campos. Sino, retorna horasContrato.
 */
export function calcularTotalAsignacion(asig: Asignacion): number {
  if (asig.desglose) {
    return asig.desglose.plan110 + asig.desglose.plan10 + asig.desglose.pie + asig.desglose.codocencia;
  }
  return asig.horasContrato;
}

/**
 * Obtiene la tabla de horas lectivas/no lectivas según establecimiento y horas totales
 */
export function getTablaHoras(
  totalHoras: number,
  establecimiento: Establecimiento
): TablaEntry | null {
  const tabla = establecimiento.proporcion === "65/35" ? TABLA_65_35 : TABLA_60_40;
  return tabla[totalHoras] || null;
}

/**
 * Calcula las horas lectivas totales de un docente
 * Suma las horas lectivas de todas sus asignaciones según la tabla correspondiente
 */
export function getHorasLectivasDocente(
  docente: Docente,
  establecimientos: Establecimiento[]
): number {
  let totalLectivas = 0;

  docente.asignaciones.forEach(asig => {
    const est = establecimientos.find(e => e.id === asig.establecimientoId);
    if (!est) return;

    const totalHoras = calcularTotalAsignacion(asig);
    const tablaEntry = getTablaHoras(totalHoras, est);

    if (tablaEntry) {
      totalLectivas += tablaEntry.horasLectivas;
    }
  });

  return totalLectivas;
}

/**
 * Calcula horas usadas en horarios (bloques asignados)
 * Cuenta cuántos bloques tiene asignados el docente en todos los horarios
 */
export function getHorasUsadasDocente(
  docenteId: number,
  horarios: Record<string, Record<string, unknown>>
): number {
  let horasUsadas = 0;

  Object.values(horarios).forEach(horarioCurso => {
    Object.values(horarioCurso).forEach((bloque: unknown) => {
      const bloqueTyped = bloque as { docenteId: number };
      if (bloqueTyped.docenteId === docenteId) {
        horasUsadas++;
      }
    });
  });

  return horasUsadas;
}

/**
 * Calcula horas disponibles para asignar en horarios
 * Horas disponibles = Horas lectivas - Horas usadas
 */
export function getHorasDisponiblesDocente(
  docente: Docente,
  establecimientos: Establecimiento[],
  horarios: Record<string, Record<string, unknown>>
): number {
  const horasLectivas = getHorasLectivasDocente(docente, establecimientos);
  const horasUsadas = getHorasUsadasDocente(docente.id, horarios);
  return Math.max(0, horasLectivas - horasUsadas);
}

/**
 * Verifica si hay conflicto de horario
 * Retorna el nombre del curso donde hay conflicto, o null si no hay conflicto
 */
export function tieneConflictoHorario(
  docenteId: number,
  dia: string,
  bloqueId: number,
  cursoActual: string,
  horarios: Record<string, Record<string, unknown>>
): string | null {
  const bloqueKey = `${dia}-${bloqueId}`;

  for (const [cursoKey, horarioCurso] of Object.entries(horarios)) {
    if (cursoKey === cursoActual) continue; // Ignorar el curso actual

    const bloque = horarioCurso[bloqueKey];
    if (bloque) {
      const bloqueTyped = bloque as { docenteId: number };
      if (bloqueTyped.docenteId === docenteId) {
        return cursoKey; // Retorna el curso donde hay conflicto
      }
    }
  }

  return null; // No hay conflicto
}

/**
 * Calcula las horas no lectivas totales de un docente
 */
export function getHorasNoLectivasDocente(
  docente: Docente,
  establecimientos: Establecimiento[]
): number {
  let totalNoLectivas = 0;

  docente.asignaciones.forEach(asig => {
    const est = establecimientos.find(e => e.id === asig.establecimientoId);
    if (!est) return;

    const totalHoras = calcularTotalAsignacion(asig);
    const tablaEntry = getTablaHoras(totalHoras, est);

    if (tablaEntry) {
      totalNoLectivas += tablaEntry.horasNoLectivas;
    }
  });

  return totalNoLectivas;
}

/**
 * Calcula el total de horas contratadas de un docente
 */
export function getTotalHorasContratadasDocente(docente: Docente): number {
  return docente.asignaciones.reduce((sum, asig) => {
    return sum + calcularTotalAsignacion(asig);
  }, 0);
}
