// Funciones de validación para docentes y asignaciones

import { Docente, Asignacion } from '@/types';
import { MAX_HORAS, MIN_HORAS } from '@/lib/constants/tablas-horas';
import { calcularTotalAsignacion } from './calculos-horas';

/**
 * Valida formato de RUT chileno usando el algoritmo del dígito verificador
 * @param rut RUT en formato XX.XXX.XXX-X o XXXXXXXX-X o XXXXXXXXX
 * @returns true si el RUT es válido, false en caso contrario
 */
export function validarRut(rut: string): boolean {
  // Eliminar puntos y guión
  const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '').trim();

  if (rutLimpio.length < 2) return false;

  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toUpperCase();

  // Validar que el cuerpo sean solo números
  if (!/^\d+$/.test(cuerpo)) return false;

  // Calcular dígito verificador
  let suma = 0;
  let multiplo = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  const dvEsperado = 11 - (suma % 11);
  const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : String(dvEsperado);

  return dv === dvCalculado;
}

/**
 * Formatea RUT a formato estándar chileno XX.XXX.XXX-X
 * @param rut RUT sin formato o con formato parcial
 * @returns RUT formateado
 */
export function formatearRut(rut: string): string {
  const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '').trim();

  if (rutLimpio.length < 2) return rut;

  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toUpperCase();

  // Formatear cuerpo con puntos (de derecha a izquierda, cada 3 dígitos)
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${cuerpoFormateado}-${dv}`;
}

/**
 * Valida los datos de un docente
 * @param docente Datos parciales del docente a validar
 * @returns Objeto con resultado de validación y lista de errores
 */
export function validarDocente(docente: Partial<Docente>): { valido: boolean; errores: string[] } {
  const errores: string[] = [];

  // Validar nombre
  if (!docente.nombre || docente.nombre.trim() === '') {
    errores.push('El nombre es obligatorio');
  }

  // Validar RUT
  if (!docente.rut || docente.rut.trim() === '') {
    errores.push('El RUT es obligatorio');
  } else if (!validarRut(docente.rut)) {
    errores.push('El RUT no tiene un formato válido');
  }

  // Validar asignaciones
  if (!docente.asignaciones || docente.asignaciones.length === 0) {
    errores.push('Debe tener al menos una asignación');
  } else {
    // Validar cada asignación
    docente.asignaciones.forEach((asig, index) => {
      const total = calcularTotalAsignacion(asig);

      if (total < MIN_HORAS) {
        errores.push(`Asignación ${index + 1}: Mínimo ${MIN_HORAS} hora requerida`);
      }

      if (total > MAX_HORAS) {
        errores.push(`Asignación ${index + 1}: Máximo ${MAX_HORAS} horas permitidas`);
      }
    });
  }

  // Validar total global de horas
  const horasGlobales = docente.asignaciones?.reduce((sum, asig) => {
    return sum + calcularTotalAsignacion(asig);
  }, 0) || 0;

  if (horasGlobales > MAX_HORAS) {
    errores.push(`Total de horas (${horasGlobales}h) excede el máximo legal de ${MAX_HORAS}h`);
  }

  if (horasGlobales < MIN_HORAS) {
    errores.push(`Total de horas (${horasGlobales}h) debe ser al menos ${MIN_HORAS}h`);
  }

  return {
    valido: errores.length === 0,
    errores
  };
}

/**
 * Valida una asignación individual
 * @param asig Datos parciales de la asignación a validar
 * @returns Objeto con resultado de validación y lista de errores
 */
export function validarAsignacion(asig: Partial<Asignacion>): { valido: boolean; errores: string[] } {
  const errores: string[] = [];

  if (!asig.establecimientoId) {
    errores.push('Debe seleccionar un establecimiento');
  }

  const total = asig.desglose
    ? (asig.desglose.plan110 || 0) + (asig.desglose.plan10 || 0) + (asig.desglose.pie || 0) + (asig.desglose.codocencia || 0)
    : asig.horasContrato || 0;

  if (total < MIN_HORAS) {
    errores.push(`El total debe ser al menos ${MIN_HORAS} hora`);
  }

  if (total > MAX_HORAS) {
    errores.push(`El total no puede exceder ${MAX_HORAS} horas`);
  }

  // Validar que si tiene desglose, al menos un campo sea mayor a 0
  if (asig.desglose) {
    const tieneValores = asig.desglose.plan110 > 0 || asig.desglose.plan10 > 0 ||
                         asig.desglose.pie > 0 || asig.desglose.codocencia > 0;
    if (!tieneValores) {
      errores.push('Debe asignar al menos 1 hora en algún campo');
    }
  }

  return {
    valido: errores.length === 0,
    errores
  };
}

/**
 * Limpia y normaliza un RUT (elimina caracteres no válidos)
 * @param rut RUT con o sin formato
 * @returns RUT limpio (solo números y K)
 */
export function limpiarRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

/**
 * Valida si un valor de horas es válido
 * @param horas Valor a validar
 * @returns true si está en el rango permitido
 */
export function validarHoras(horas: number): boolean {
  return horas >= MIN_HORAS && horas <= MAX_HORAS && Number.isInteger(horas);
}
