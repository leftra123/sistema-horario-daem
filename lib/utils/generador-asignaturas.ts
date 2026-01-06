import { Asignatura } from '@/types';

// Paleta de colores vibrantes y modernos
const COLORES_DISPONIBLES = [
  '#ef4444', // red-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#10b981', // emerald-500
  '#06b6d4', // cyan-500
  '#f59e0b', // amber-500
  '#a855f7', // purple-500
  '#64748b', // slate-500
  '#f97316', // orange-500
  '#14b8a6', // teal-500
  '#d946ef', // fuchsia-500
  '#84cc16', // lime-500
  '#0ea5e9', // sky-500
  '#eab308', // yellow-500
  '#f43f5e', // rose-500
  '#22c55e', // green-500
  '#6366f1', // indigo-500
  '#fb923c', // orange-400
  '#a78bfa', // violet-400
  '#34d399', // emerald-400
  '#60a5fa', // blue-400
  '#fbbf24', // amber-400
  '#2dd4bf', // teal-400
];

/**
 * Genera un código corto (2-3 letras) basado en el nombre de la asignatura
 */
export function generarCodigo(nombre: string, asignaturasExistentes: Asignatura[]): string {
  const palabras = nombre.trim().split(/\s+/);

  let codigo = '';

  // Estrategia 1: Primeras letras de cada palabra
  if (palabras.length > 1) {
    codigo = palabras
      .map(p => p[0])
      .join('')
      .toUpperCase()
      .substring(0, 3);
  } else {
    // Estrategia 2: Primeras 3 letras de la palabra
    codigo = palabras[0].substring(0, 3).toUpperCase();
  }

  // Verificar si el código ya existe
  const codigoExiste = asignaturasExistentes.some(a => a.codigo === codigo);

  if (codigoExiste) {
    // Agregar número al final
    let contador = 2;
    while (asignaturasExistentes.some(a => a.codigo === `${codigo}${contador}`)) {
      contador++;
    }
    codigo = `${codigo}${contador}`;
  }

  return codigo;
}

/**
 * Selecciona un color que no esté siendo usado
 */
export function seleccionarColorDisponible(asignaturasExistentes: Asignatura[]): string {
  const coloresUsados = new Set(asignaturasExistentes.map(a => a.color.toLowerCase()));

  // Buscar primer color disponible
  const colorDisponible = COLORES_DISPONIBLES.find(color => !coloresUsados.has(color.toLowerCase()));

  if (colorDisponible) {
    return colorDisponible;
  }

  // Si todos están usados, generar color aleatorio
  const hue = Math.floor(Math.random() * 360);
  const saturation = 60 + Math.floor(Math.random() * 20); // 60-80%
  const lightness = 45 + Math.floor(Math.random() * 10);  // 45-55%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Crea una nueva asignatura con color y código auto-generados
 */
export function crearAsignatura(
  nombre: string,
  asignaturasExistentes: Asignatura[]
): Asignatura {
  const codigo = generarCodigo(nombre, asignaturasExistentes);
  const color = seleccionarColorDisponible(asignaturasExistentes);

  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    codigo,
    nombre: nombre.trim(),
    color,
    editable: true
  };
}
