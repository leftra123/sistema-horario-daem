// Funciones centralizadas para cálculo de horas según Ley 20.903
// TODAS las validaciones y cálculos deben usar estas funciones

import { Docente, Asignacion, Establecimiento, CicloEnsenanza, Proporcion, TipoAsignacion } from '@/types';
import { TABLA_60_40, TABLA_65_35, TablaEntry, MAX_HORAS, MIN_HORAS } from '@/lib/constants/tablas-horas';

/**
 * Busca en tabla normativa cuántas horas lectivas corresponden
 * @param horasContrato Horas de jornada semanal (44, 43, 42, etc.)
 * @param proporcion "60/40" | "65/35"
 * @returns Horas lectivas en HA (entero)
 * @throws Si horasContrato > 44 o < 1
 * @throws Si proporcion no es válida
 *
 * @example
 * getHorasLectivasDeTabla(44, "65/35") → 29
 * getHorasLectivasDeTabla(44, "60/40") → 26
 * getHorasLectivasDeTabla(30, "65/35") → 20
 */
export function getHorasLectivasDeTabla(
  horasContrato: number,
  proporcion: Proporcion
): number {
  // Validar rango de horas
  if (horasContrato > MAX_HORAS) {
    throw new Error(
      `Horas de contrato ${horasContrato} excede el máximo legal de ${MAX_HORAS} horas semanales`
    );
  }

  if (horasContrato < MIN_HORAS) {
    throw new Error(
      `Horas de contrato ${horasContrato} debe ser al menos ${MIN_HORAS} hora`
    );
  }

  // Seleccionar tabla según proporción
  const tabla = proporcion === "60/40" ? TABLA_60_40 : TABLA_65_35;
  const entry = tabla[horasContrato];

  if (!entry) {
    throw new Error(
      `No se encontró entrada en tabla ${proporcion} para ${horasContrato} horas`
    );
  }

  return entry.horasLectivas;
}

/**
 * Calcula las horas no lectivas
 * Fórmula: Jornada - Lectivas = No Lectivas
 * @param horasContrato Jornada semanal
 * @param horasLectivas Horas en aula
 * @returns Horas no lectivas
 *
 * @example
 * calcularHorasNoLectivas(44, 29) → 15
 * calcularHorasNoLectivas(44, 26) → 18
 */
export function calcularHorasNoLectivas(
  horasContrato: number,
  horasLectivas: number
): number {
  const resultado = horasContrato - horasLectivas;

  if (resultado < 0) {
    throw new Error(
      `Error de cálculo: horasLectivas (${horasLectivas}) no puede ser mayor que horasContrato (${horasContrato})`
    );
  }

  return resultado;
}

/**
 * Determina la proporción correcta basada en ciclo y establecimiento
 * @param ciclo "Primer Ciclo" | "Segundo Ciclo"
 * @param esEstablecimientoPrioritario boolean (80%+ alumnos prioritarios)
 * @returns "60/40" | "65/35"
 *
 * Regla:
 * - Primer Ciclo + 80%+ prioritarios = 60/40
 * - Resto = 65/35
 *
 * @example
 * getProporcionalidad("Primer Ciclo", true) → "60/40"
 * getProporcionalidad("Primer Ciclo", false) → "65/35"
 * getProporcionalidad("Segundo Ciclo", true) → "65/35"
 * getProporcionalidad("Segundo Ciclo", false) → "65/35"
 */
export function getProporcionalidad(
  ciclo: CicloEnsenanza,
  esEstablecimientoPrioritario: boolean
): Proporcion {
  // Según Ley 20.903:
  // Tabla 60/40 solo aplica a Primer Ciclo con 80%+ alumnos prioritarios
  if (ciclo === "Primer Ciclo" && esEstablecimientoPrioritario) {
    return "60/40";
  }

  // Tabla 65/35 aplica a:
  // - Segundo Ciclo (siempre)
  // - Primer Ciclo sin 80%+ prioritarios
  return "65/35";
}

/**
 * Calcula horas disponibles para asignación EN BLOQUES
 * REGLA: Directiva y PIE NO usan bloques
 * REGLA: Normal + SEP + EIB SÍ usan bloques
 * @param asignacion Asignación del docente
 * @returns Horas disponibles para bloques (0 si es Directiva o PIE)
 *
 * @example
 * getHorasDisponiblesParaBloques({ tipoAsignacion: "Normal", horasLectivas: 29 }) → 29
 * getHorasDisponiblesParaBloques({ tipoAsignacion: "Directiva", horasLectivas: 0 }) → 0
 * getHorasDisponiblesParaBloques({ tipoAsignacion: "PIE", horasLectivas: 8 }) → 0
 */
export function getHorasDisponiblesParaBloques(
  asignacion: Asignacion
): number {
  // Directiva y PIE NO tienen bloques en horario
  if (asignacion.tipoAsignacion === "Directiva" || asignacion.tipoAsignacion === "PIE") {
    return 0;
  }

  // Normal, SEP, EIB SÍ tienen bloques
  return asignacion.horasLectivas;
}

/**
 * Obtiene horas TOTALES usadas por un docente (SUMA DE TODAS SUS ASIGNACIONES)
 * REGLA: PIE NO suma en total (es adicional)
 * @param docente Docente
 * @returns Total horas que computan contra contrato
 *
 * @example
 * // Docente con: 30h Normal + 14h Directiva + 8h PIE
 * getTotalHorasUsadasDocente(docente) → 44 (sin contar PIE)
 */
export function getTotalHorasUsadasDocente(docente: Docente): number {
  return docente.asignaciones
    .filter(a => a.tipoAsignacion !== "PIE") // PIE NO suma
    .reduce((sum, a) => sum + a.horasContrato, 0);
}

/**
 * Obtiene horas LECTIVAS totales usadas por un docente
 * REGLA: PIE NO suma en total (es adicional)
 * @param docente Docente
 * @returns Total horas lectivas que computan contra contrato
 */
export function getTotalHorasLectivasDocente(docente: Docente): number {
  return docente.asignaciones
    .filter(a => a.tipoAsignacion !== "PIE")
    .reduce((sum, a) => sum + a.horasLectivas, 0);
}

/**
 * Obtiene horas NO LECTIVAS totales usadas por un docente
 * REGLA: PIE NO suma en total (es adicional)
 * @param docente Docente
 * @returns Total horas no lectivas que computan contra contrato
 */
export function getTotalHorasNoLectivasDocente(docente: Docente): number {
  return docente.asignaciones
    .filter(a => a.tipoAsignacion !== "PIE")
    .reduce((sum, a) => sum + a.horasNoLectivas, 0);
}

/**
 * Obtiene total de horas PIE (adicionales) del docente
 * @param docente Docente
 * @returns Total horas PIE (no computan contra contrato)
 */
export function getTotalHorasPIE(docente: Docente): number {
  return docente.asignaciones
    .filter(a => a.tipoAsignacion === "PIE")
    .reduce((sum, a) => sum + a.horasContrato, 0);
}

/**
 * Valida que no se haya excedido la jornada semanal
 * @param docente Docente
 * @param horasContratoMaximas Horas máximas del contrato (opcional, default: suma de horasContrato de asignaciones)
 * @throws Si total de horas (sin PIE) > horasContrato
 *
 * @example
 * validarNoExcesoHoras(docente) // throws si excede
 */
export function validarNoExcesoHoras(docente: Docente, horasContratoMaximas?: number): void {
  const horas_usadas = getTotalHorasUsadasDocente(docente);

  // Si no se especifica horasContratoMaximas, calcular la suma de todas las asignaciones
  const horas_contrato = horasContratoMaximas ?? getTotalHorasUsadasDocente(docente);

  if (horas_usadas > horas_contrato) {
    throw new Error(
      `Docente ${docente.nombre} excede su contrato: ` +
      `${horas_usadas}h asignadas > ${horas_contrato}h contrato. ` +
      `(PIE no suma en este cálculo)`
    );
  }
}

/**
 * Valida que "Directiva" no tenga bloques asignados
 * @param asignacion Asignación
 * @throws Si Directiva tiene bloquesAsignados.length > 0
 */
export function validarDirectivaNoTieneBloques(
  asignacion: Asignacion
): void {
  if (
    asignacion.tipoAsignacion === "Directiva" &&
    asignacion.bloquesAsignados &&
    asignacion.bloquesAsignados.length > 0
  ) {
    throw new Error(
      `Error: Asignación de tipo "Directiva" no puede tener bloques asignados. ` +
      `Las horas directivas son "no lectivas" y no se imparten en aula.`
    );
  }
}

/**
 * Valida que "PIE" no tenga bloques asignados
 * @param asignacion Asignación
 * @throws Si PIE tiene bloquesAsignados.length > 0
 */
export function validarPIENoTieneBloques(
  asignacion: Asignacion
): void {
  if (
    asignacion.tipoAsignacion === "PIE" &&
    asignacion.bloquesAsignados &&
    asignacion.bloquesAsignados.length > 0
  ) {
    throw new Error(
      `Error: Asignación de tipo "PIE" no puede tener bloques asignados. ` +
      `PIE es un servicio adicional sin horario de bloques.`
    );
  }
}

/**
 * Calcula horas usadas en horarios (bloques asignados)
 * Cuenta cuántos bloques tiene asignados el docente en todos los horarios
 */
export function getHorasUsadasEnBloques(
  docenteId: number,
  horarios: Record<string, Record<string, { docenteId: number }>>
): number {
  let horasUsadas = 0;

  Object.values(horarios).forEach(horarioCurso => {
    Object.values(horarioCurso).forEach(bloque => {
      if (bloque.docenteId === docenteId) {
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
  horarios: Record<string, Record<string, { docenteId: number }>>
): number {
  const horasLectivas = getTotalHorasLectivasDocente(docente);
  const horasUsadas = getHorasUsadasEnBloques(docente.id, horarios);
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
  horarios: Record<string, Record<string, { docenteId: number }>>
): string | null {
  const bloqueKey = `${dia}-${bloqueId}`;

  for (const [cursoKey, horarioCurso] of Object.entries(horarios)) {
    if (cursoKey === cursoActual) continue; // Ignorar el curso actual

    const bloque = horarioCurso[bloqueKey];
    if (bloque && bloque.docenteId === docenteId) {
      return cursoKey; // Retorna el curso donde hay conflicto
    }
  }

  return null; // No hay conflicto
}

/**
 * DEPRECADO - Usar getTotalHorasLectivasDocente
 * Calcula las horas lectivas totales de un docente
 * Suma las horas lectivas de todas sus asignaciones según la tabla correspondiente
 */
export function getHorasLectivasDocente(
  docente: Docente,
  establecimientos: Establecimiento[]
): number {
  return getTotalHorasLectivasDocente(docente);
}

/**
 * DEPRECADO - Usar getTotalHorasNoLectivasDocente
 * Calcula las horas no lectivas totales de un docente
 */
export function getHorasNoLectivasDocente(
  docente: Docente,
  establecimientos: Establecimiento[]
): number {
  return getTotalHorasNoLectivasDocente(docente);
}

/**
 * DEPRECADO
 * Calcula el total de horas contratadas de un docente
 */
export function getTotalHorasContratadasDocente(docente: Docente): number {
  return getTotalHorasUsadasDocente(docente);
}

/**
 * DEPRECADO
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
 * DEPRECADO
 * Obtiene la tabla de horas lectivas/no lectivas según establecimiento y horas totales
 */
export function getTablaHoras(
  totalHoras: number,
  establecimiento: Establecimiento
): TablaEntry | null {
  // NOTA: Establecimiento ya no tiene proporcion, se debe usar proporcion de Asignacion
  // Esta función queda por compatibilidad pero no debe usarse
  const proporcion = "65/35"; // Default por compatibilidad
  const tabla = proporcion === "65/35" ? TABLA_65_35 : TABLA_60_40;
  return tabla[totalHoras] || null;
}

// ============================================================================
// FUNCIONES DE RESUMEN
// ============================================================================

/**
 * Interface para el resumen completo de horas de un docente
 */
export interface ResumenHorasDocente {
  nombre: string;
  horasContrato: number;
  horasLectivas: number;
  horasNoLectivas: number;
  horasPIE: number;
  detalleAsignaciones: {
    establecimiento: string;
    tipo: TipoAsignacion;
    horas: number;
    proporcion: Proporcion;
    horasLectivas: number;
    horasNoLectivas: number;
  }[];
}

/**
 * Genera un resumen completo de las horas de un docente
 * Útil para reportes, exportación a Excel/PDF, y visualización en dashboard
 *
 * @param docente - El docente del cual generar el resumen
 * @returns Objeto con todos los datos de horas del docente
 *
 * @example
 * const resumen = generarResumenDocente(docente);
 * console.log(`${resumen.nombre}: ${resumen.horasLectivas}h lectivas de ${resumen.horasContrato}h totales`);
 */
export function generarResumenDocente(docente: Docente): ResumenHorasDocente {
  const horasLectivas = getTotalHorasLectivasDocente(docente);
  const horasNoLectivas = getTotalHorasNoLectivasDocente(docente);
  const horasPIE = getTotalHorasPIE(docente);
  const horasContrato = getTotalHorasUsadasDocente(docente);

  return {
    nombre: docente.nombre,
    horasContrato,
    horasLectivas,
    horasNoLectivas,
    horasPIE,
    detalleAsignaciones: docente.asignaciones.map(a => ({
      establecimiento: a.establecimientoNombre,
      tipo: a.tipoAsignacion,
      horas: a.horasContrato,
      proporcion: a.proporcion,
      horasLectivas: a.horasLectivas,
      horasNoLectivas: a.horasNoLectivas,
    })),
  };
}
