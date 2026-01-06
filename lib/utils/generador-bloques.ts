// lib/utils/generador-bloques.ts
import { BloqueConfig } from '@/types';

/**
 * Genera bloques de horario desde una configuración personalizada
 */
export function generarBloquesDesdeConfiguracion(config: {
  horaInicio: string;
  horaTermino: string;
  duracionBloque: number;
  recreos: { bloque: number; duracionMinutos: number }[];
  colacion?: { bloque: number; duracionMinutos: number };
}): BloqueConfig[] {
  const bloques: BloqueConfig[] = [];
  let horaActual = parseHora(config.horaInicio);
  const horaFin = parseHora(config.horaTermino);
  let bloqueId = 1;
  let contadorBloques = 0; // Contador de bloques de clase para saber cuándo insertar recreos

  while (horaActual < horaFin) {
    // Verificar si hay recreo después del bloque de clase anterior
    const recreo = config.recreos.find(r => r.bloque === contadorBloques);
    if (recreo && contadorBloques > 0) {
      bloques.push({
        id: bloqueId++,
        horaInicio: formatHora(horaActual),
        horaFin: formatHora(agregarMinutos(horaActual, recreo.duracionMinutos)),
        tipo: "recreo",
        duracionMinutos: recreo.duracionMinutos
      });
      horaActual = agregarMinutos(horaActual, recreo.duracionMinutos);
    }

    // Verificar si hay colación después del bloque de clase anterior
    if (config.colacion && config.colacion.bloque === contadorBloques && contadorBloques > 0) {
      bloques.push({
        id: bloqueId++,
        horaInicio: formatHora(horaActual),
        horaFin: formatHora(agregarMinutos(horaActual, config.colacion.duracionMinutos)),
        tipo: "colacion",
        duracionMinutos: config.colacion.duracionMinutos
      });
      horaActual = agregarMinutos(horaActual, config.colacion.duracionMinutos);
    }

    // Verificar que no nos pasemos de la hora de término
    const siguienteHora = agregarMinutos(horaActual, config.duracionBloque);
    if (siguienteHora > horaFin) {
      break;
    }

    // Agregar bloque de clase
    bloques.push({
      id: bloqueId++,
      horaInicio: formatHora(horaActual),
      horaFin: formatHora(siguienteHora),
      tipo: "clase",
      duracionMinutos: config.duracionBloque
    });
    horaActual = siguienteHora;
    contadorBloques++;
  }

  return bloques;
}

/**
 * Parsea una hora en formato "HH:mm" a un objeto Date
 */
function parseHora(hora: string): Date {
  const [horas, minutos] = hora.split(':').map(Number);
  const fecha = new Date();
  fecha.setHours(horas, minutos, 0, 0);
  return fecha;
}

/**
 * Formatea un objeto Date a string "HH:mm"
 */
function formatHora(fecha: Date): string {
  const horas = fecha.getHours().toString().padStart(2, '0');
  const minutos = fecha.getMinutes().toString().padStart(2, '0');
  return `${horas}:${minutos}`;
}

/**
 * Agrega minutos a un objeto Date y retorna un nuevo Date
 */
function agregarMinutos(fecha: Date, minutos: number): Date {
  const nuevaFecha = new Date(fecha);
  nuevaFecha.setMinutes(nuevaFecha.getMinutes() + minutos);
  return nuevaFecha;
}

/**
 * Valida una configuración de horarios
 */
export function validarConfiguracionHorario(config: {
  horaInicio: string;
  horaTermino: string;
  duracionBloque: number;
  recreos: { bloque: number; duracionMinutos: number }[];
  colacion?: { bloque: number; duracionMinutos: number };
}): { valido: boolean; errores: string[] } {
  const errores: string[] = [];

  // Validar formato de horas
  const regexHora = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!regexHora.test(config.horaInicio)) {
    errores.push('Hora de inicio inválida (formato debe ser HH:mm)');
  }
  if (!regexHora.test(config.horaTermino)) {
    errores.push('Hora de término inválida (formato debe ser HH:mm)');
  }

  // Validar que hora inicio < hora término
  if (parseHora(config.horaInicio) >= parseHora(config.horaTermino)) {
    errores.push('La hora de inicio debe ser menor que la hora de término');
  }

  // Validar duración de bloque
  if (config.duracionBloque < 30 || config.duracionBloque > 90) {
    errores.push('La duración del bloque debe estar entre 30 y 90 minutos');
  }

  // Validar duración total no exceda 12 horas
  const duracionTotal = (parseHora(config.horaTermino).getTime() - parseHora(config.horaInicio).getTime()) / (1000 * 60 * 60);
  if (duracionTotal > 12) {
    errores.push('La jornada no puede exceder 12 horas');
  }

  // Generar bloques y validar que haya al menos 6 bloques de clase
  const bloques = generarBloquesDesdeConfiguracion(config);
  const bloquesClase = bloques.filter(b => b.tipo === 'clase');
  if (bloquesClase.length < 6) {
    errores.push('Debe haber al menos 6 bloques de clase');
  }

  return {
    valido: errores.length === 0,
    errores
  };
}
