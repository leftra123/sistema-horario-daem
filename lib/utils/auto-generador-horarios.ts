import { Docente, BloqueConfig, Asignatura, HorarioData, Establecimiento } from '@/types';
import { getHorasLectivasDocente } from './calculos-horas';

interface ResultadoGeneracion {
  exito: boolean;
  bloquesAsignados: number;
  bloquesSinAsignar: { dia: string; bloqueId: number; razon: string }[];
  mensajes: string[];
  asignaciones: {
    dia: string;
    bloqueId: number;
    asignatura: Asignatura;
    docenteId: number;
    docenteNombre: string;
  }[];
}

export function autoGenerarHorarioCurso(
  cursoKey: string,
  establecimientoId: number,
  docentes: Docente[],
  asignaturas: Asignatura[],
  bloques: BloqueConfig[],
  horarios: HorarioData,
  establecimientos: Establecimiento[],
  getHorasUsadasDocente: (docenteId: number) => number,
  tieneConflictoHorario: (docenteId: number, dia: string, bloqueId: number, cursoActual: string) => { conflicto: boolean }
): ResultadoGeneracion {
  const resultado: ResultadoGeneracion = {
    exito: false,
    bloquesAsignados: 0,
    bloquesSinAsignar: [],
    mensajes: [],
    asignaciones: []
  };

  // Filtrar solo docentes del establecimiento con horas disponibles
  const docentesDisponibles = docentes.filter(d => {
    const tieneAsignacion = d.asignaciones.some(a => a.establecimientoId === establecimientoId);
    if (!tieneAsignacion) return false;

    const horasLectivas = getHorasLectivasDocente(d, establecimientos);
    const horasUsadas = getHorasUsadasDocente(d.id);
    return horasLectivas > horasUsadas;
  });

  if (docentesDisponibles.length === 0) {
    resultado.mensajes.push('⚠️ No hay docentes disponibles con horas libres en este establecimiento');
    return resultado;
  }

  // Obtener bloques de clase vacíos
  const horarioActual = horarios[cursoKey] || {};
  const bloquesClase = bloques.filter(b => b.tipo === 'clase');
  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  let asignados = 0;
  let intentos = 0;
  const maxIntentos = 100; // Evitar loops infinitos

  // Estrategia simple: Intentar llenar todos los bloques vacíos
  DIAS.forEach(dia => {
    bloquesClase.forEach(bloque => {
      const bloqueKey = `${dia}-${bloque.id}`;

      // Si ya está asignado, skip
      if (horarioActual[bloqueKey]) {
        asignados++;
        return;
      }

      // Buscar docente disponible para este bloque
      let asignado = false;
      for (const docente of docentesDisponibles) {
        if (intentos++ > maxIntentos) break;

        // Verificar horas disponibles
        const horasLectivas = getHorasLectivasDocente(docente, establecimientos);
        const horasUsadas = getHorasUsadasDocente(docente.id);
        const disponibles = horasLectivas - horasUsadas;

        if (disponibles <= 0) continue;

        // Verificar día bloqueado
        const asignacion = docente.asignaciones.find(a => a.establecimientoId === establecimientoId);
        if (asignacion?.diasBloqueados?.includes(dia)) {
          continue;
        }

        // Verificar conflicto de horario
        const resultadoConflicto = tieneConflictoHorario(docente.id, dia, bloque.id, cursoKey);
        if (resultadoConflicto.conflicto) {
          continue;
        }

        // Seleccionar asignatura aleatoria (en una versión más avanzada se podría usar especialidad del docente)
        const asignatura = asignaturas[Math.floor(Math.random() * asignaturas.length)];

        // Registrar asignación
        resultado.asignaciones.push({
          dia,
          bloqueId: bloque.id,
          asignatura,
          docenteId: docente.id,
          docenteNombre: docente.nombre
        });

        resultado.mensajes.push(
          `✅ ${dia} Bloque ${bloque.id} (${bloque.horaInicio}): ${asignatura.nombre} - ${docente.nombre}`
        );

        asignados++;
        asignado = true;
        break; // Bloque asignado, pasar al siguiente
      }

      // Si no se pudo asignar
      if (!asignado) {
        resultado.bloquesSinAsignar.push({
          dia,
          bloqueId: bloque.id,
          razon: 'No hay docentes disponibles sin conflictos'
        });
      }
    });
  });

  resultado.bloquesAsignados = resultado.asignaciones.length;
  resultado.exito = resultado.bloquesSinAsignar.length === 0;

  if (resultado.exito) {
    resultado.mensajes.unshift(`🎉 ¡Horario generado completamente! ${resultado.bloquesAsignados} bloques asignados.`);
  } else {
    resultado.mensajes.unshift(
      `⚠️ Se asignaron ${resultado.bloquesAsignados} bloques de ${bloquesClase.length * DIAS.length} totales. Faltan ${resultado.bloquesSinAsignar.length} bloques.`
    );
  }

  return resultado;
}

/**
 * Aplica las asignaciones generadas automáticamente al store
 * Retorna el número de bloques asignados exitosamente
 */
export function aplicarAutoGeneracion(
  asignaciones: ResultadoGeneracion['asignaciones'],
  cursoKey: string,
  asignarBloqueCallback: (
    cursoKey: string,
    dia: string,
    bloqueId: number,
    asignatura: Asignatura,
    docenteId: number
  ) => { success: boolean; error?: string }
): { exitosos: number; fallidos: number; errores: string[] } {
  let exitosos = 0;
  let fallidos = 0;
  const errores: string[] = [];

  asignaciones.forEach(asig => {
    const result = asignarBloqueCallback(
      cursoKey,
      asig.dia,
      asig.bloqueId,
      asig.asignatura,
      asig.docenteId
    );

    if (result.success) {
      exitosos++;
    } else {
      fallidos++;
      if (result.error) {
        errores.push(`${asig.dia} Bloque ${asig.bloqueId}: ${result.error}`);
      }
    }
  });

  return { exitosos, fallidos, errores };
}
